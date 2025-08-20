import React, { useState } from 'react';
import { FiExternalLink, FiCopy, FiDownload, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function FontInventory({ fonts, onCopyFont }) {
  const [previewFont, setPreviewFont] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopyFont = (fontName) => {
    onCopyFont(fontName);
  };

  const handleDownloadFont = (font) => {
    if (font.url) {
      window.open(font.url, '_blank');
    } else {
      toast.error('Download link not available for this font');
    }
  };

  const handlePreviewFont = (font) => {
    setPreviewFont(font);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewFont(null);
  };

  if (fonts.length === 0) {
    return (
      <div className="font-inventory">
        <h3>Font Inventory</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No fonts found. Click "Inspect Page Fonts" to analyze the current page.
        </p>
      </div>
    );
  }

  return (
    <div className="font-inventory">
      <h3>Fonts Found ({fonts.length})</h3>
      
      <div className="font-list">
        {fonts.map((font, index) => (
          <div key={`${font.name}-${index}`} className="font-item">
            <div className="font-info">
              <div className="font-name" style={{ fontFamily: font.name }}>
                {font.name}
              </div>
              <div className="font-details">
                {font.weight && `Weight: ${font.weight}`}
                {font.style && font.weight && ' • '}
                {font.style && `Style: ${font.style}`}
                {font.url && ' • Google Fonts available'}
              </div>
            </div>
            
            <div className="font-actions">
              <button
                className="action-btn small"
                onClick={() => handlePreviewFont(font)}
                title="Preview font"
              >
                <FiEye />
              </button>
              <button
                className="action-btn small"
                onClick={() => handleCopyFont(font.name)}
                title="Copy font name"
              >
                <FiCopy />
              </button>
              {font.url && (
                <button
                  className="action-btn small"
                  onClick={() => handleDownloadFont(font)}
                  title="Download from Google Fonts"
                >
                  <FiDownload />
                </button>
              )}
              {font.url && (
                <button
                  className="action-btn small"
                  onClick={() => window.open(font.url, '_blank')}
                  title="View on Google Fonts"
                >
                  <FiExternalLink />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Font Preview Modal */}
      {showPreview && previewFont && (
        <div className="font-preview-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div className="font-preview-content" style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Font Preview: {previewFont.name}</h3>
              <button
                onClick={closePreview}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="font-preview-samples">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Regular Text</h4>
                <p style={{ 
                  fontFamily: previewFont.name, 
                  fontSize: '16px', 
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate how the font looks in regular usage.
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Large Heading</h4>
                <h1 style={{ 
                  fontFamily: previewFont.name, 
                  fontSize: '32px', 
                  margin: 0,
                  fontWeight: previewFont.weight || 'normal'
                }}>
                  Sample Heading
                </h1>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Small Text</h4>
                <p style={{ 
                  fontFamily: previewFont.name, 
                  fontSize: '12px', 
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  This is smaller text that shows how the font performs at different sizes.
                </p>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: '#6c757d' }}>Numbers & Symbols</h4>
                <p style={{ 
                  fontFamily: previewFont.name, 
                  fontSize: '18px', 
                  margin: 0
                }}>
                  0123456789 !@#$%^&*()_+-=[]{}|;':",./<>?
                </p>
              </div>
            </div>
            
            <div className="font-preview-actions" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
              <button
                className="action-btn primary"
                onClick={() => handleCopyFont(previewFont.name)}
              >
                <FiCopy />
                Copy Font Name
              </button>
              {previewFont.url && (
                <button
                  className="action-btn secondary"
                  onClick={() => handleDownloadFont(previewFont)}
                >
                  <FiDownload />
                  Download Font
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
