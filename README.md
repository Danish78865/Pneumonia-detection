# PneuAI - Pneumonia Detection System

Clinical-grade AI-powered pneumonia detection using Hybrid Vision Transformer + CNN architecture.

## 🏥 Features

- **Medical-Grade Interface**: Professional diagnostic workstation UI
- **Real-time Analysis**: Upload X-ray images for instant AI-powered diagnosis
- **Advanced Visualization**: 
  - Three.js anatomical lung wireframe animations
  - ECG-style monitoring during analysis
  - Attention heatmaps showing model focus areas
- **Clinical Performance**: 93.4% accuracy with 99.5% recall
- **Responsive Design**: Works on all devices with medical-grade precision

## 🚀 Deployment

This project is optimized for deployment on Vercel.

### Prerequisites
- Node.js 18+
- Vercel CLI (optional)
- Vercel account

### Quick Deploy

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   # Method 1: Using Vercel CLI
   vercel
   
   # Method 2: Using Vercel web dashboard
   # 1. Push your code to GitHub
   # 2. Import project in Vercel dashboard
   # 3. Connect repository and deploy
   ```

3. **Environment Variables** (if needed):
   ```bash
   # For production API endpoint
   REACT_APP_API_ENDPOINT=https://your-api-domain.com
   ```

## 📊 Model Performance

- **Accuracy**: 93.4%
- **Recall**: 99.5% (Excellent for medical screening)
- **Precision**: 90.9%
- **F1 Score**: 94.98%
- **Test Dataset**: 624 images

## 🛠 Technology Stack

- **Frontend**: React 19 + Vite
- **Animations**: Framer Motion + Three.js
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📁 Project Structure

```
website/
├── src/
│   ├── App.jsx              # Main clinical interface
│   ├── main.jsx             # Application entry point
│   ├── index.css            # Global styles
│   └── modelService.js      # API integration service
├── public/
│   └── index.html           # HTML template
├── package.json             # Dependencies and scripts
├── vercel.json              # Vercel configuration
└── README.md               # This file
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏥 Medical Disclaimer

This AI system is designed for research and educational purposes only. All results must be reviewed and confirmed by a licensed radiologist before clinical use.

## 📄 License

MIT License - © 2024 PneuAI Systems

## 🌐 Live Demo

Deployed on Vercel: [Your Vercel URL will appear here after deployment]
