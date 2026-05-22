import React from 'react';

function App() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '20px', 
      backgroundColor: '#f5f7fa',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#0A2540', fontSize: '2rem' }}>
        PneuAI Diagnostics
      </h1>
      <p style={{ color: '#6B7A99', fontSize: '1.1rem' }}>
        Clinical-Grade Pneumonia Detection System
      </p>
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h2 style={{ color: '#0066CC', fontSize: '1.5rem' }}>
          System Status: Online
        </h2>
        <p style={{ color: '#4A5568', lineHeight: '1.6' }}>
          This is a minimal test version to verify the deployment is working.
          The full clinical interface will be loaded once we confirm this basic version works.
        </p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#E8F0FB', 
            padding: '15px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0066CC' }}>
              93.4%
            </div>
            <div style={{ color: '#6B7A99', fontSize: '0.9rem' }}>
              Accuracy
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#E3F5EE', 
            padding: '15px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00875A' }}>
              99.5%
            </div>
            <div style={{ color: '#6B7A99', fontSize: '0.9rem' }}>
              Recall
            </div>
          </div>
          <div style={{ 
            backgroundColor: '#FDECEA', 
            padding: '15px', 
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#C0392B' }}>
              90.9%
            </div>
            <div style={{ color: '#6B7A99', fontSize: '0.9rem' }}>
              Precision
            </div>
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#FEF3C7', 
          padding: '15px', 
          borderRadius: '6px',
          marginTop: '20px',
          borderLeft: '4px solid #B45309'
        }}>
          <strong style={{ color: '#B45309' }}>⚠ Clinical Advisory:</strong>
          <span style={{ color: '#B45309', marginLeft: '8px' }}>
            AI output is decision-support only. All results must be reviewed and confirmed by a licensed radiologist.
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
