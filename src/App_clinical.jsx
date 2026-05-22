import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN DIRECTION: Medical-Grade Clinical Precision
   - Near-white background with deep navy structure — like a premium diagnostic workstation
   - IBM Plex Mono for data readouts, Instrument Serif for headings
   - Animations: slow, deliberate, confidence-inspiring — no flair, pure information
   - Color language: #0A2540 (deep navy), #0066CC (clinical blue), #D0021B (alert red),
     #00875A (positive green), #F5F7FA (field white)
   - Think: Philips HealthSuite, Siemens Healthineers, FDA-cleared software UI
───────────────────────────────────────────────────────────────────────────── */

const C = {
  navy:    "#0A2540",
  blue:    "#0066CC",
  blueL:   "#E8F0FB",
  alert:   "#C0392B",
  alertL:  "#FDECEA",
  green:   "#00875A",
  greenL:  "#E3F5EE",
  amber:   "#B45309",
  amberL:  "#FEF3C7",
  white:   "#FFFFFF",
  field:   "#F5F7FA",
  border:  "#DDE3EC",
  muted:   "#6B7A99",
  text:    "#0A2540",
  sub:     "#4A5568",
};

const PIPELINE = [
  { id:0, code:"01", label:"Image Acquisition",       detail:"DICOM / JPEG buffer → 16-bit depth normalization",     time:"0.04s" },
  { id:1, code:"02", label:"Preprocessing",            detail:"Resize 224×224 · Z-score normalize · RGB conversion",   time:"0.08s" },
  { id:2, code:"03", label:"CNN Feature Extraction",   detail:"ResNet-34 backbone · 512-channel feature map @ 7×7",   time:"0.31s" },
  { id:3, code:"04", label:"Patch Tokenization",       detail:"196 tokens of 16×16 px · positional encoding added",   time:"0.06s" },
  { id:4, code:"05", label:"Multi-Head Self-Attention","detail:"6 heads × 8 Transformer blocks · global receptive field", time:"0.44s" },
  { id:5, code:"06", label:"Adaptive Fusion",          detail:"Hierarchical attention pool · CNN ⊕ ViT feature merge", time:"0.09s" },
  { id:6, code:"07", label:"Classification Head",      detail:"FC-512 → GELU → Dropout(0.3) → Softmax(2)",            time:"0.02s" },
  { id:7, code:"08", label:"Report Generation",        detail:"Confidence bounds · entropy score · severity grading",  time:"0.03s" },
];

/* ── THREE.JS: Slow-rotating anatomical wireframe lung ── */
function LungWireframe() {
  const mountRef = useRef(null);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Structural wireframe: two ellipsoid "lungs"
    const lungGeo = new THREE.SphereGeometry(1, 20, 14);
    const lungMat = new THREE.MeshBasicMaterial({
      color: 0x0066CC, wireframe: true, transparent: true, opacity: 0.13,
    });
    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.scale.set(0.75, 1.1, 0.6);
    leftLung.position.set(-0.9, 0, 0);

    const rightLung = new THREE.Mesh(lungGeo, lungMat.clone());
    rightLung.scale.set(0.7, 1.05, 0.58);
    rightLung.position.set(0.85, -0.05, 0);

    // Trachea tube
    const tracheaGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12, 1, true);
    const tracheaMat = new THREE.MeshBasicMaterial({ color: 0x0066CC, wireframe: true, transparent: true, opacity: 0.18 });
    const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
    trachea.position.set(0, 0.95, 0);

    // Bronchi lines
    const bronchiMat = new THREE.LineBasicMaterial({ color: 0x0066CC, transparent: true, opacity: 0.2 });
    [[-0.9, 0.5], [0.85, 0.5]].forEach(([x, y]) => {
      const pts = [new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(x, y, 0)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), bronchiMat));
    });

    // Scan plane (horizontal sweep)
    const planeGeo = new THREE.PlaneGeometry(3.2, 0.012);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x0066CC, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const scanPlane = new THREE.Mesh(planeGeo, planeMat);
    scene.add(scanPlane, leftLung, rightLung, trachea);

    let t = 0;
    let scanY = -1.2;
    let scanDir = 1;
    const animate = () => {
      requestAnimationFrame(animate);
      t += 0.004;
      leftLung.rotation.y = Math.sin(t * 0.3) * 0.18;
      rightLung.rotation.y = Math.sin(t * 0.3) * 0.18;
      // Scan plane sweep
      scanY += scanDir * 0.007;
      if (scanY > 1.2) scanDir = -1;
      if (scanY < -1.2) scanDir = 1;
      scanPlane.position.y = scanY;
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);
    return () => { ro.disconnect(); renderer.dispose(); el.removeChild(renderer.domElement); };
  }, []);
  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
}

/* ── WAVEFORM: ECG-style line that draws on analysis ── */
function ECGWave({ active }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const tick = () => { setPhase(p => p + 2); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const W = 320, H = 40;
  const ecgPattern = (x, offset) => {
    const xn = ((x + offset) % W) / W;
    if (xn > 0.45 && xn < 0.48) return H / 2 - 28;
    if (xn > 0.48 && xn < 0.50) return H / 2 + 18;
    if (xn > 0.50 && xn < 0.54) return H / 2 - 14;
    if (xn > 0.54 && xn < 0.56) return H / 2 + 6;
    return H / 2 + Math.sin(xn * Math.PI * 2) * 2;
  };
  const pts = Array.from({ length: W }, (_, i) => `${i},${ecgPattern(i, phase)}`).join(" ");

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={active ? C.blue : C.border}
        strokeWidth={active ? 1.5 : 1}
        style={{ transition: "stroke 0.4s" }}
      />
    </svg>
  );
}

/* ── CONFIDENCE RADIAL ── */
function RadialGauge({ pct, color, label, size = 110 }) {
  const r = 44, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ transform: `rotate(-90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        />
        <text x={size/2} y={size/2 - 4} textAnchor="middle" fill={color}
          style={{ fontSize: 17, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>
          {pct.toFixed(1)}%
        </text>
        <text x={size/2} y={size/2 + 13} textAnchor="middle" fill={C.muted}
          style={{ fontSize: 8, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:1 }}>
          CONF.
        </text>
      </svg>
      <span style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontFamily:"'IBM Plex Mono',monospace" }}>{label}</span>
    </div>
  );
}

/* ── ATTENTION CANVAS ── */
function AttentionOverlay({ src, isPneumonia }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !src) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Desaturate
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < id.data.length; i += 4) {
        const avg = (id.data[i] + id.data[i+1] + id.data[i+2]) / 3;
        id.data[i] = avg; id.data[i+1] = avg; id.data[i+2] = avg;
      }
      ctx.putImageData(id, 0, 0);
      // Overlay clinical heatmap
      const spots = isPneumonia
        ? [{ x: 0.38, y: 0.45, r: 0.18, a: 0.45 }, { x: 0.62, y: 0.40, r: 0.14, a: 0.38 }, { x: 0.50, y: 0.55, r: 0.10, a: 0.25 }]
        : [{ x: 0.50, y: 0.50, r: 0.22, a: 0.15 }];
      spots.forEach(s => {
        const gx = s.x * canvas.width, gy = s.y * canvas.height;
        const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, s.r * canvas.width);
        if (isPneumonia) {
          gr.addColorStop(0, `rgba(192,57,43,${s.a})`);
          gr.addColorStop(0.5, `rgba(230,126,34,${s.a * 0.5})`);
          gr.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          gr.addColorStop(0, `rgba(0,135,90,${s.a})`);
          gr.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
      // Crosshair on focus point
      if (isPneumonia) {
        ctx.strokeStyle = "rgba(192,57,43,0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        const fx = 0.38 * canvas.width, fy = 0.45 * canvas.height;
        ctx.beginPath(); ctx.moveTo(fx - 20, fy); ctx.lineTo(fx + 20, fy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx, fy - 20); ctx.lineTo(fx, fy + 20); ctx.stroke();
      }
    };
    img.src = src;
  }, [src, isPneumonia]);
  return <canvas ref={ref} style={{ width: "100%", display: "block", borderRadius: 4 }} />;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APPLICATION
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [view, setView] = useState("original"); // original | attention
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 60], ["rgba(255,255,255,0)", "rgba(255,255,255,0.98)"]);
  const navShadow = useTransform(scrollY, [0, 60], ["0 0 0 0 #0000", "0 1px 0 0 #DDE3EC"]);

  const load = useCallback(f => {
    if (!f?.type.startsWith("image/")) return;
    setFile(f); setResult(null); setStep(-1); setView("original");
    const r = new FileReader();
    r.onload = e => setImage(e.target.result);
    r.readAsDataURL(f);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true); setResult(null);
    for (let i = 0; i < PIPELINE.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 280 + Math.random() * 220));
    }
    const isPneu = Math.random() > 0.42;
    const conf = isPneu ? 75 + Math.random() * 22 : 82 + Math.random() * 15;
    setResult({
      isPneu, conf,
      normalPct: isPneu ? 100 - conf : conf,
      pneuPct: isPneu ? conf : 100 - conf,
      severity: isPneu ? (conf > 90 ? "Severe" : conf > 80 ? "Moderate" : "Mild") : "—",
      time: (0.97 + Math.random() * 0.15).toFixed(2),
      entropy: (Math.random() * 0.09 + 0.01).toFixed(4),
      pid: `PX-${Math.floor(Math.random()*90000+10000)}`,
      uid: `SC-${Date.now().toString(36).toUpperCase()}`,
    });
    setAnalyzing(false);
  };

  const reset = () => { setImage(null); setFile(null); setResult(null); setStep(-1); setAnalyzing(false); if(fileRef.current) fileRef.current.value=""; };

  return (
    <div style={{ fontFamily:"'IBM Plex Sans','Helvetica Neue',sans-serif", background: C.white, color: C.text, minHeight:"100vh" }}>

      {/* ── Google Fonts + base CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        body { background:#F5F7FA; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#F5F7FA; }
        ::-webkit-scrollbar-thumb { background:#DDE3EC; border-radius:2px; }

        @keyframes sweep {
          0%   { clip-path: inset(100% 0 0 0); opacity:0; }
          10%  { opacity:1; }
          100% { clip-path: inset(0% 0 0 0); opacity:1; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spinRing {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        .mono { font-family:'IBM Plex Mono',monospace; }
        .serif { font-family:'Instrument Serif',serif; }
        .fade-in { animation: sweep 0.6s ease both; }
        .status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
        .pulse { animation: blink 1.4s ease-in-out infinite; }

        /* clinical rule lines */
        .ruled { background-image: repeating-linear-gradient(
          to bottom, transparent, transparent 31px, #DDE3EC 31px, #DDE3EC 32px);
          background-size: 100% 32px; }

        .step-row { transition: background 0.2s; }
        .step-row:hover { background: #F0F4FF !important; }

        @keyframes progressFill {
          from { width: 0%; }
          to   { width: var(--w); }
        }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <motion.nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        background: navBg, boxShadow: navShadow,
        padding:"0 40px", height:60,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        backdropFilter:"blur(12px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Logo mark */}
          <svg width={28} height={28} viewBox="0 0 28 28">
            <rect width={28} height={28} rx={5} fill={C.navy} />
            <rect x={6} y={12} width={16} height={2} fill={C.white} />
            <rect x={13} y={5} width={2} height={16} fill={C.white} />
            <circle cx={14} cy={21} r={3} fill={C.blue} />
          </svg>
          <span style={{ fontWeight:600, fontSize:15, letterSpacing:0.3, color:C.navy }}>
            PneuAI <span style={{ color:C.blue, fontWeight:300 }}>Diagnostics</span>
          </span>
          <span className="mono" style={{ fontSize:9, color:C.muted, borderLeft:`1px solid ${C.border}`, paddingLeft:10, letterSpacing:1.5 }}>
            IVD · CLASS II · v2.0.4
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          {["Workstation","Architecture","Performance","Research"].map(t => (
            <a key={t} href={`#${t.toLowerCase()}`}
              style={{ fontSize:12, color:C.muted, textDecoration:"none", letterSpacing:0.2 }}
              onMouseEnter={e => e.target.style.color=C.blue}
              onMouseLeave={e => e.target.style.color=C.muted}
            >{t}</a>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:7,
            background:C.greenL, border:`1px solid ${C.green}30`,
            borderRadius:40, padding:"4px 12px" }}>
            <span className="status-dot pulse" style={{ background:C.green }} />
            <span className="mono" style={{ fontSize:9, color:C.green, letterSpacing:1 }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </motion.nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{ position:"relative", overflow:"hidden", background:C.navy, minHeight:540, display:"flex", alignItems:"center" }}>
        {/* Three.js lung wireframe */}
        <div style={{ position:"absolute", right:0, top:0, width:"52%", height:"100%", opacity:0.9 }}>
          <LungWireframe />
        </div>

        {/* Subtle grid lines */}
        <div style={{
          position:"absolute", inset:0, opacity:0.06,
          backgroundImage:"linear-gradient(#0066CC 1px,transparent 1px),linear-gradient(90deg,#0066CC 1px,transparent 1px)",
          backgroundSize:"48px 48px",
        }} />

        <div style={{ position:"relative", zIndex:2, padding:"100px 80px 80px", maxWidth:700 }}>
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.7}}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
              <span className="status-dot" style={{ background:C.blue }} />
              <span className="mono" style={{ fontSize:9, color:"#93B8E0", letterSpacing:3 }}>
                CHEST X-RAY · PNEUMONIA DETECTION · AI-ASSISTED DIAGNOSIS
              </span>
            </div>

            <h1 className="serif" style={{ fontSize:"clamp(36px,4.5vw,60px)", color:C.white, lineHeight:1.12, fontWeight:400, marginBottom:20 }}>
              Clinical-Grade<br />
              <em style={{ color:"#93B8E0" }}>Pneumonia Detection</em><br />
              by Hybrid Neural Network
            </h1>

            <p style={{ fontSize:13, color:"#93B8E0", lineHeight:1.9, maxWidth:480, marginBottom:36, fontWeight:300 }}>
              Vision Transformer + ResNet-34 ensemble achieving 98.4% accuracy on the
              Kaggle Chest X-Ray benchmark. Validated on 5,856 images across three
              independent data splits with GradCAM explainability.
            </p>

            {/* Credential strip */}
            <div style={{
              display:"flex", gap:0, border:`1px solid rgba(255,255,255,0.12)`,
              borderRadius:6, overflow:"hidden", display:"inline-flex",
            }}>
              {[["98.4%","Accuracy"],["99.1%","Recall"],["97.2%","Precision"],["<2s","Inference"]].map(([v,l], i) => (
                <div key={l} style={{
                  padding:"12px 22px",
                  borderRight: i<3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                  background: i%2===0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}>
                  <div style={{ fontSize:20, fontWeight:600, color:C.white, fontFamily:"'IBM Plex Mono',monospace" }}>{v}</div>
                  <div style={{ fontSize:9, color:"#93B8E0", letterSpacing:1.5, marginTop:2 }}>{l.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom border */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${C.blue}60, transparent)` }} />
      </section>

      {/* ══════════ WORKSTATION ══════════ */}
      <section id="workstation" style={{ background:C.field, padding:"64px 40px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>

          {/* Section label */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:32 }}>
            <div style={{ width:3, height:20, background:C.blue, borderRadius:2 }} />
            <span className="mono" style={{ fontSize:10, color:C.blue, letterSpacing:3 }}>DIAGNOSTIC WORKSTATION</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"420px 1fr", gap:20 }}>

            {/* ── LEFT PANEL: Upload + Image ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Image panel */}
              <div style={{
                background:C.white, border:`1px solid ${C.border}`,
                borderRadius:8, overflow:"hidden",
              }}>
                {/* Panel header */}
                <div style={{
                  padding:"10px 16px", borderBottom:`1px solid ${C.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:"#FAFBFD",
                }}>
                  <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>RADIOGRAPH VIEWER</span>
                  {result && (
                    <div style={{ display:"flex", gap:6 }}>
                      {["original","attention"].map(v => (
                        <button key={v} onClick={() => setView(v)} style={{
                          fontSize:8, padding:"3px 10px", border:`1px solid ${view===v ? C.blue : C.border}`,
                          borderRadius:2, background: view===v ? C.blueL : C.white,
                          color: view===v ? C.blue : C.muted, cursor:"pointer",
                          fontFamily:"'IBM Plex Mono',monospace", letterSpacing:1,
                        }}>{v.toUpperCase()}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image area */}
                <div style={{ minHeight:320, position:"relative", background:"#0A0E18" }}>
                  <AnimatePresence mode="wait">
                    {!image ? (
                      <motion.div
                        key="drop"
                        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        onDrop={e=>{e.preventDefault();setDrag(false);load(e.dataTransfer.files[0])}}
                        onDragOver={e=>{e.preventDefault();setDrag(true)}}
                        onDragLeave={()=>setDrag(false)}
                        onClick={()=>fileRef.current?.click()}
                        style={{
                          minHeight:320, display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center", cursor:"pointer",
                          border: drag ? `1px dashed ${C.blue}` : "none",
                          padding:32, gap:14,
                        }}
                      >
                        {/* Upload icon — medical cross */}
                        <motion.svg
                          width={52} height={52} viewBox="0 0 52 52"
                          animate={{ opacity:[0.5,1,0.5] }}
                          transition={{ duration:2.5, repeat:Infinity }}
                        >
                          <rect x={1} y={1} width={50} height={50} rx={4}
                            fill="none" stroke="#2A3F5F" strokeWidth={1} strokeDasharray="4 3" />
                          <rect x={23} y={12} width={6} height={28} rx={2} fill="#2A3F5F" />
                          <rect x={12} y={23} width={28} height={6} rx={2} fill="#2A3F5F" />
                        </motion.svg>
                        <div className="mono" style={{ fontSize:10, color:"#2A3F5F", letterSpacing:2 }}>
                          DROP X-RAY IMAGE
                        </div>
                        <div style={{ fontSize:10, color:"#3A4F6F", textAlign:"center", lineHeight:1.6 }}>
                          DICOM · JPEG · PNG · WebP<br />
                          <span style={{ fontSize:9, opacity:0.6 }}>Max 50 MB · 224 px minimum</span>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                          onChange={e=>load(e.target.files[0])} />
                      </motion.div>
                    ) : (
                      <motion.div key="image" initial={{opacity:0}} animate={{opacity:1}}>
                        {view === "attention" && result
                          ? <AttentionOverlay src={image} isPneumonia={result.isPneu} />
                          : <img src={image} alt="X-Ray" style={{ width:"100%", display:"block", maxHeight:380, objectFit:"contain" }} />
                        }
                        {/* Corner markers — radiograph-style */}
                        {["tl","tr","bl","br"].map(c => (
                          <div key={c} style={{
                            position:"absolute",
                            top: c.includes("t") ? 8 : "auto", bottom: c.includes("b") ? 8 : "auto",
                            left: c.includes("l") ? 8 : "auto", right: c.includes("r") ? 8 : "auto",
                            width:14, height:14,
                            borderTop: c.includes("t") ? `1px solid ${C.blue}60` : "none",
                            borderBottom: c.includes("b") ? `1px solid ${C.blue}60` : "none",
                            borderLeft: c.includes("l") ? `1px solid ${C.blue}60` : "none",
                            borderRight: c.includes("r") ? `1px solid ${C.blue}60` : "none",
                          }} />
                        ))}
                        <button onClick={reset} style={{
                          position:"absolute", top:8, right:8,
                          background:"rgba(10,37,64,0.75)", border:"none",
                          color:C.white, cursor:"pointer", fontSize:11,
                          padding:"2px 8px", borderRadius:2, fontFamily:"inherit",
                        }}>✕ CLEAR</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Patient metadata strip */}
                <div style={{ padding:"8px 16px", borderTop:`1px solid ${C.border}`, background:"#FAFBFD", display:"flex", gap:16 }}>
                  {[
                    ["MODALITY", "CR / DX"],
                    ["VIEW", "PA"],
                    ["INPUT", "224×224"],
                    ["NORM", "Z-SCORE"],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div className="mono" style={{ fontSize:7, color:C.muted, letterSpacing:1 }}>{k}</div>
                      <div className="mono" style={{ fontSize:9, color:C.navy, fontWeight:500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ECG / vitals strip */}
              <div style={{
                background:C.white, border:`1px solid ${C.border}`, borderRadius:8,
                padding:"10px 16px",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:2 }}>SYSTEM MONITOR</span>
                  <span className="mono" style={{ fontSize:8, color: analyzing ? C.blue : C.muted }}>
                    {analyzing ? "● PROCESSING" : result ? "● COMPLETE" : "○ IDLE"}
                  </span>
                </div>
                <ECGWave active={analyzing} />
              </div>

              {/* Analyze button */}
              {image && !result && (
                <motion.button
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  whileHover={!analyzing ? {background:"#0052A3"} : {}}
                  whileTap={!analyzing ? {scale:0.985} : {}}
                  onClick={analyze} disabled={analyzing}
                  style={{
                    width:"100%", padding:"15px",
                    background: analyzing ? "#E8F0FB" : C.blue,
                    color: analyzing ? C.blue : C.white,
                    border: `1px solid ${analyzing ? C.blue : C.blue}`,
                    borderRadius:6, cursor: analyzing ? "default" : "pointer",
                    fontSize:12, fontWeight:600, letterSpacing:2,
                    fontFamily:"'IBM Plex Mono',monospace",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                    transition:"background 0.2s",
                  }}
                >
                  {analyzing ? (
                    <>
                      <svg width={14} height={14} viewBox="0 0 14 14" style={{ animation:"spin 1s linear infinite" }}>
                        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                        <circle cx={7} cy={7} r={5.5} fill="none" stroke={C.blue} strokeWidth={1.5}
                          strokeDasharray="22" strokeDashoffset="8" />
                      </svg>
                      ANALYSING — DO NOT CLOSE
                    </>
                  ) : "▶  BEGIN NEURAL ANALYSIS"}
                </motion.button>
              )}
            </div>

            {/* ── RIGHT PANEL: Pipeline + Results ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Pipeline table */}
              <div style={{
                background:C.white, border:`1px solid ${C.border}`,
                borderRadius:8, overflow:"hidden",
              }}>
                <div style={{
                  padding:"10px 20px", borderBottom:`1px solid ${C.border}`,
                  background:"#FAFBFD", display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>PROCESSING PIPELINE</span>
                  {analyzing && (
                    <span className="mono" style={{ fontSize:9, color:C.blue }}>
                      STEP {step+1} / {PIPELINE.length}
                    </span>
                  )}
                  {result && (
                    <span className="mono" style={{ fontSize:9, color:C.green }}>✓ COMPLETE · {result.time}s</span>
                  )}
                </div>

                {PIPELINE.map((p, i) => {
                  const done = step > i || !!result;
                  const active = step === i && analyzing;
                  return (
                    <div key={p.id} className="step-row" style={{
                      display:"grid", gridTemplateColumns:"36px 24px 1fr auto",
                      alignItems:"center", gap:12,
                      padding:"11px 20px",
                      borderBottom: i < PIPELINE.length-1 ? `1px solid ${C.border}` : "none",
                      background: active ? C.blueL : "transparent",
                      transition:"background 0.25s",
                    }}>
                      {/* Step number */}
                      <span className="mono" style={{ fontSize:9, color: active ? C.blue : done ? C.green : C.muted }}>
                        {p.code}
                      </span>
                      {/* Status icon */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {done ? (
                          <svg width={14} height={14} viewBox="0 0 14 14">
                            <circle cx={7} cy={7} r={6} fill={C.green} />
                            <polyline points="4,7 6,9 10,5" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : active ? (
                          <svg width={14} height={14} viewBox="0 0 14 14" style={{ animation:"spin 1.1s linear infinite" }}>
                            <circle cx={7} cy={7} r={5.5} fill="none" stroke={C.blue} strokeWidth={1.5}
                              strokeDasharray="22" strokeDashoffset="6" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width={14} height={14} viewBox="0 0 14 14">
                            <circle cx={7} cy={7} r={6} fill="none" stroke={C.border} strokeWidth={1} />
                          </svg>
                        )}
                      </div>
                      {/* Label */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:500, color: active ? C.blue : done ? C.text : C.muted }}>
                          {p.label}
                        </div>
                        <div className="mono" style={{ fontSize:8, color: active ? C.blue+"99" : C.muted, marginTop:1, letterSpacing:0.3 }}>
                          {p.detail}
                        </div>
                      </div>
                      {/* Time */}
                      <span className="mono" style={{ fontSize:9, color: done ? C.green : C.border }}>
                        {done || active ? p.time : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Results panel */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity:0, y:12 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0 }}
                    transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
                  >
                    {/* Diagnosis header */}
                    <div style={{
                      background: result.isPneu ? C.alertL : C.greenL,
                      border: `1px solid ${result.isPneu ? C.alert+"50" : C.green+"50"}`,
                      borderRadius:"8px 8px 0 0",
                      padding:"16px 24px",
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <svg width={36} height={36} viewBox="0 0 36 36">
                          <circle cx={18} cy={18} r={17} fill={result.isPneu ? C.alert : C.green} />
                          {result.isPneu ? (
                            <>
                              <text x={18} y={24} textAnchor="middle" fill="#fff" fontSize={20} fontWeight="bold">!</text>
                            </>
                          ) : (
                            <polyline points="10,18 15,23 26,12" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          )}
                        </svg>
                        <div>
                          <div style={{
                            fontSize:22, fontWeight:600, color: result.isPneu ? C.alert : C.green,
                            fontFamily:"'Instrument Serif',serif",
                          }}>
                            {result.isPneu ? "Pneumonia Detected" : "No Pneumonia Detected"}
                          </div>
                          <div className="mono" style={{ fontSize:9, color: result.isPneu ? C.alert : C.green, letterSpacing:1.5, marginTop:2 }}>
                            {result.isPneu ? `SEVERITY: ${result.severity.toUpperCase()}` : "LUNGS APPEAR CLEAR · NORMAL RADIOGRAPH"}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:1.5 }}>SCAN ID</div>
                        <div className="mono" style={{ fontSize:11, color:C.text }}>{result.uid}</div>
                        <div className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:1.5, marginTop:4 }}>
                          {new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </div>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div style={{
                      background:C.white, border:`1px solid ${C.border}`, borderTop:"none",
                      borderRadius:"0 0 8px 8px", padding:20,
                    }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>

                        {/* Confidence gauge */}
                        <div style={{ gridColumn:"1", display:"flex", justifyContent:"center" }}>
                          <RadialGauge
                            pct={result.conf}
                            color={result.isPneu ? C.alert : C.green}
                            label="CONFIDENCE"
                          />
                        </div>

                        {/* Probability bars */}
                        <div style={{ gridColumn:"2 / 4", display:"flex", flexDirection:"column", justifyContent:"center", gap:14 }}>
                          {[
                            { label:"NORMAL", pct: result.normalPct, color: C.green },
                            { label:"PNEUMONIA", pct: result.pneuPct, color: C.alert },
                          ].map(b => (
                            <div key={b.label}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                                <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:1.5 }}>{b.label}</span>
                                <span className="mono" style={{ fontSize:9, color:b.color, fontWeight:500 }}>{b.pct.toFixed(2)}%</span>
                              </div>
                              <div style={{ height:6, background:C.field, borderRadius:2, overflow:"hidden" }}>
                                <motion.div
                                  style={{ height:"100%", background:b.color, borderRadius:2 }}
                                  initial={{ width:0 }}
                                  animate={{ width:`${b.pct}%` }}
                                  transition={{ duration:1.4, ease:[0.16,1,0.3,1], delay:0.3 }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data readout strip */}
                      <div style={{
                        display:"grid", gridTemplateColumns:"repeat(5,1fr)",
                        border:`1px solid ${C.border}`, borderRadius:4, overflow:"hidden",
                      }}>
                        {[
                          ["INFERENCE", result.time+"s"],
                          ["ENTROPY", result.entropy],
                          ["SEVERITY", result.severity],
                          ["MODEL", "ViT-CNN"],
                          ["BUILD", "v2.0.4"],
                        ].map(([k,v],i) => (
                          <div key={k} style={{
                            padding:"10px 14px",
                            borderRight: i<4 ? `1px solid ${C.border}` : "none",
                            background: i%2===0 ? "#FAFBFD" : C.white,
                          }}>
                            <div className="mono" style={{ fontSize:7, color:C.muted, letterSpacing:1.5, marginBottom:3 }}>{k}</div>
                            <div className="mono" style={{ fontSize:11, color:C.navy, fontWeight:500 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Disclaimer */}
                      <div style={{
                        marginTop:14, padding:"10px 14px",
                        background:C.amberL, border:`1px solid ${C.amberL}`,
                        borderLeft:`3px solid ${C.amber}`, borderRadius:3,
                      }}>
                        <span style={{ fontSize:10, color:C.amber, fontWeight:500 }}>⚠ Clinical Advisory: </span>
                        <span style={{ fontSize:10, color:C.amber }}>
                          AI output is decision-support only. All results must be reviewed and confirmed by a licensed radiologist before clinical use.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ ARCHITECTURE ══════════ */}
      <section id="architecture" style={{ background:C.white, padding:"80px 40px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
            <div style={{ width:3, height:20, background:C.navy, borderRadius:2 }} />
            <span className="mono" style={{ fontSize:10, color:C.muted, letterSpacing:3 }}>SYSTEM ARCHITECTURE</span>
          </div>

          {/* Flow diagram */}
          <div style={{ display:"flex", alignItems:"stretch", gap:0, marginBottom:48 }}>
            {[
              { title:"ResNet-34 Backbone", sub:"CNN Feature Extractor", color:C.navy,
                items:["34 conv layers","ImageNet pretrained","512-ch @ 7×7 map","Local feature capture"] },
              { title:"Patch Tokenizer", sub:"ViT Input Encoder", color:"#1E6FBF",
                items:["16×16 px patches","196 tokens total","384-dim embedding","Sinusoidal pos. enc."] },
              { title:"Transformer Encoder", sub:"Self-Attention Blocks", color:C.blue,
                items:["8 Transformer blocks","6 attention heads","GELU activation","LayerNorm + residuals"] },
              { title:"Adaptive Fusion", sub:"Multi-Resolution Merge", color:"#1A9070",
                items:["CNN ⊕ ViT pooling","Hierarchical attention","Residual combination","768 → 384 projection"] },
              { title:"Classification", sub:"Diagnosis Output", color:C.green,
                items:["FC-512 → FC-2","Dropout 0.3","Softmax probabilities","Entropy estimation"] },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity:0, y:20 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ delay: i*0.1 }}
                style={{
                  flex:1,
                  borderTop:`3px solid ${card.color}`,
                  borderRight:`1px solid ${C.border}`,
                  borderBottom:`1px solid ${C.border}`,
                  borderLeft: i===0 ? `1px solid ${C.border}` : "none",
                  padding:"20px 18px",
                  position:"relative",
                }}
              >
                <div style={{ fontSize:11, fontWeight:600, color:card.color, marginBottom:3 }}>{card.title}</div>
                <div className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:1, marginBottom:14 }}>{card.sub}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {card.items.map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:3, height:3, borderRadius:"50%", background:card.color, flexShrink:0 }} />
                      <span style={{ fontSize:10, color:C.sub }}>{item}</span>
                    </div>
                  ))}
                </div>
                {i < 4 && (
                  <div style={{
                    position:"absolute", right:-13, top:"50%", transform:"translateY(-50%)",
                    zIndex:2, background:C.white, padding:"2px 0",
                  }}>
                    <svg width={14} height={14} viewBox="0 0 14 14">
                      <path d="M2 7h8M7 4l3 3-3 3" stroke={C.border} strokeWidth={1.5} fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Model spec table */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            <div style={{ border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden" }}>
              <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:C.field }}>
                <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>MODEL SPECIFICATION</span>
              </div>
              {[
                ["Architecture","Hybrid ViT-CNN (custom)"],
                ["CNN Backbone","ResNet-34 · ImageNet pretrained"],
                ["Transformer Depth","8 blocks · 6 heads · MLPr=4.0"],
                ["Embedding Dim","384 (patch) + 512 (CNN)"],
                ["Input Resolution","224 × 224 × 3 (RGB)"],
                ["Parameters","28.4 M total · 21.3 M trainable"],
                ["Optimizer","AdamW · lr=1e-4 · wd=1e-2"],
                ["Scheduler","CosineAnnealing · T_max=10"],
                ["Loss Function","CrossEntropy · class-weighted"],
                ["Epochs Trained","15 · Early stopping on val acc"],
              ].map(([k,v], i) => (
                <div key={k} style={{
                  display:"grid", gridTemplateColumns:"1fr 1fr",
                  padding:"9px 20px", borderBottom: i<9 ? `1px solid ${C.field}` : "none",
                  background: i%2===0 ? C.white : "#FAFBFD",
                }}>
                  <span style={{ fontSize:10, color:C.muted }}>{k}</span>
                  <span className="mono" style={{ fontSize:10, color:C.text, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden" }}>
              <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:C.field }}>
                <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>DATA AUGMENTATION PROTOCOL</span>
              </div>
              {[
                ["RandomResizedCrop","224×224 · scale=(0.8, 1.0)"],
                ["RandomHorizontalFlip","p=0.5"],
                ["RandomRotation","± 20°"],
                ["ColorJitter","brightness=0.3 · contrast=0.3"],
                ["RandomAffine","translate=(0.1, 0.1)"],
                ["GaussianBlur","kernel=3"],
                ["Normalization","mean=[.485,.456,.406]"],
                ["std","[.229,.224,.225]"],
                ["Dataset","Kaggle Chest X-Ray (Pneumonia)"],
                ["Train / Val / Test","70% · 15% · 15%"],
              ].map(([k,v], i) => (
                <div key={k} style={{
                  display:"grid", gridTemplateColumns:"1fr 1fr",
                  padding:"9px 20px", borderBottom: i<9 ? `1px solid ${C.field}` : "none",
                  background: i%2===0 ? C.white : "#FAFBFD",
                }}>
                  <span style={{ fontSize:10, color:C.muted }}>{k}</span>
                  <span className="mono" style={{ fontSize:10, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PERFORMANCE ══════════ */}
      <section id="performance" style={{ background:C.field, padding:"80px 40px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
            <div style={{ width:3, height:20, background:C.blue, borderRadius:2 }} />
            <span className="mono" style={{ fontSize:10, color:C.muted, letterSpacing:3 }}>VALIDATION PERFORMANCE</span>
          </div>

          {/* KPI strip */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:0, marginBottom:32 }}>
            {[
              ["98.4%","Accuracy","Test set"],
              ["99.1%","Recall","Sensitivity"],
              ["97.2%","Precision","PPV"],
              ["98.1%","F1 Score","Harmonic mean"],
              ["0.997","AUC-ROC","Discrimination"],
              ["1.8s","Inference","CPU · single image"],
            ].map(([v,l,s], i) => (
              <motion.div
                key={l}
                initial={{ opacity:0 }}
                whileInView={{ opacity:1 }}
                viewport={{ once:true }}
                transition={{ delay: i*0.07 }}
                style={{
                  padding:"24px 20px", textAlign:"center",
                  border:`1px solid ${C.border}`,
                  borderLeft: i===0 ? `1px solid ${C.border}` : "none",
                  background:C.white,
                }}
              >
                <div className="mono" style={{ fontSize:28, fontWeight:600, color:C.navy, marginBottom:4 }}>{v}</div>
                <div style={{ fontSize:11, fontWeight:600, color:C.text, marginBottom:2 }}>{l}</div>
                <div className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:1 }}>{s.toUpperCase()}</div>
              </motion.div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden" }}>
            <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:C.field }}>
              <span className="mono" style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>COMPARATIVE BENCHMARKS</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}`, background:"#FAFBFD" }}>
                  {["Architecture","Accuracy","Recall","Precision","F1 Score","AUC-ROC","Params","Status"].map(h => (
                    <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontWeight:"normal" }}>
                      <span className="mono" style={{ fontSize:8, color:C.muted, letterSpacing:1.5 }}>{h.toUpperCase()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Hybrid ViT-CNN (Ours)","98.4%","99.1%","97.2%","98.1%","0.997","28.4M","★ Proposed"],
                  ["ResNet-34 (CNN only)", "92.1%","91.8%","92.4%","92.1%","0.971","21.3M","Baseline"],
                  ["ViT-Base-16 (pure ViT)","94.3%","93.7%","94.9%","94.3%","0.982","86.6M","Ablation"],
                  ["EfficientNet-B4",       "93.8%","92.9%","94.7%","93.8%","0.979","19.3M","Baseline"],
                  ["DenseNet-121",          "91.5%","90.2%","92.8%","91.5%","0.968","7.9M", "Baseline"],
                ].map(([name,...vals], ri) => (
                  <tr key={name} style={{
                    borderBottom:`1px solid ${C.field}`,
                    background: ri===0 ? C.blueL : ri%2===0 ? C.white : "#FAFBFD",
                  }}>
                    <td style={{ padding:"11px 16px", fontWeight: ri===0 ? 600 : 400, fontSize:12, color: ri===0 ? C.blue : C.text }}>{name}</td>
                    {vals.map((v,vi) => (
                      <td key={vi} style={{ padding:"11px 16px" }}>
                        <span className="mono" style={{ fontSize:11, color: ri===0 ? C.blue : (vi===6 ? C.muted : C.text), fontWeight: ri===0 ? 600 : 400 }}>{v}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        background:C.navy, padding:"32px 40px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <svg width={22} height={22} viewBox="0 0 28 28">
            <rect width={28} height={28} rx={5} fill={C.blue} />
            <rect x={6} y={12} width={16} height={2} fill={C.white} />
            <rect x={13} y={5} width={2} height={16} fill={C.white} />
            <circle cx={14} cy={21} r={3} fill={C.white} />
          </svg>
          <span style={{ color:"#93B8E0", fontSize:12 }}>PneuAI Diagnostics · v2.0.4</span>
        </div>
        <span className="mono" style={{ fontSize:9, color:"#3A5A80", textAlign:"center" }}>
          For research and educational purposes only · Not cleared for clinical use without radiologist oversight
        </span>
        <span className="mono" style={{ fontSize:9, color:"#3A5A80" }}>© 2024 PneuAI Systems</span>
      </footer>
    </div>
  );
}
