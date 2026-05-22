import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Brain, ArrowRight, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setPrediction(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateModelPrediction = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate model processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate prediction results
      const random = Math.random();
      const result = {
        prediction: random > 0.5 ? 'PNEUMONIA' : 'NORMAL',
        confidence: 70 + Math.random() * 25,
        processing_time: (1.5 + Math.random() * 2).toFixed(2)
      };
      
      setPrediction(result);
    } catch (error) {
      console.error('Error during prediction:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight">PNEU<span className="text-cyan-400">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button className="text-gray-300 hover:text-white transition-colors">Technology</button>
            <button className="text-gray-300 hover:text-white transition-colors">Research</button>
            <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-full font-semibold transition-all hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 mb-8">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 text-sm font-semibold">Advanced Neural Diagnosis</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Pneumonia Detection <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience cutting-edge medical diagnosis with our hybrid Vision Transformer + CNN model. 
              Upload chest X-rays for instant, accurate analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Analysis Tool */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Analyze Chest X-Ray</h2>
              <p className="text-gray-300">Upload an image for instant AI-powered diagnosis</p>
            </div>

            {/* Upload Area */}
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-400/50 rounded-2xl p-12 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/5 transition-all"
              >
                <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload X-Ray Image</h3>
                <p className="text-gray-400">Click to browse or drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG, DICOM</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Uploaded X-Ray"
                    className="w-full max-h-96 object-contain rounded-2xl bg-black/20"
                  />
                  <button
                    onClick={resetAnalysis}
                    className="absolute top-4 right-4 w-10 h-10 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Analyze Button */}
                {!prediction && !isAnalyzing && (
                  <div className="text-center">
                    <button
                      onClick={simulateModelPrediction}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 flex items-center gap-3 mx-auto"
                    >
                      <Brain className="w-6 h-6" />
                      Start Analysis
                    </button>
                  </div>
                )}

                {/* Processing State */}
                {isAnalyzing && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/20 border border-blue-400/30 rounded-full">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <span className="text-blue-400">Analyzing with Neural Network...</span>
                    </div>
                    
                    {/* Animated Processing Steps */}
                    <div className="mt-6 space-y-2 max-w-md mx-auto">
                      {[
                        'Preprocessing image...',
                        'Extracting features with CNN...',
                        'Analyzing with Vision Transformer...',
                        'Generating diagnosis...'
                      ].map((step, index) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.5 }}
                          className="flex items-center gap-3 text-sm text-gray-400"
                        >
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {prediction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-800/50 to-blue-800/30 border border-cyan-400/30 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {prediction.prediction === 'PNEUMONIA' ? (
                        <AlertCircle className="w-8 h-8 text-orange-400" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold">{prediction.prediction}</h3>
                        <p className="text-gray-400">Diagnosis Complete</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-black/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-cyan-400">{prediction.confidence.toFixed(1)}%</p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Processing Time</p>
                        <p className="text-2xl font-bold text-cyan-400">{prediction.processing_time}s</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={resetAnalysis}
                        className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-semibold transition-all"
                      >
                        Analyze Another Image
                      </button>
                      <button className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-semibold transition-all">
                        Download Report
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Technology</h2>
            <p className="text-gray-300 text-lg">Powered by cutting-edge neural networks</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Vision Transformer",
                description: "Global contextual understanding for comprehensive analysis"
              },
              {
                icon: Shield,
                title: "CNN Backbone",
                description: "Precise local feature extraction for detailed patterns"
              },
              {
                icon: Activity,
                title: "Real-time Processing",
                description: "Instant results with optimized neural architecture"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 hover:border-cyan-400/50 transition-all"
              >
                <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2024 PneuAI Systems. Advanced Medical AI for Pneumonia Detection</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
