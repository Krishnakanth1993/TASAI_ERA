import React, { useState } from 'react';
import { FiShare2, FiCopy, FiLink, FiCode, FiDownload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function PaletteShare({ colors }) {
  const [shareMethod, setShareMethod] = useState('link');
  const [paletteName, setPaletteName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateShareData = () => {
    const timestamp = Date.now();
    const name = paletteName.trim() || `palette-${timestamp}`;
    
    return {
      name,
      colors,
      timestamp,
      version: '1.0',
      extension: 'figma-palette'
    };
  };

  const generateShareLink = () => {
    const data = generateShareData();
    const encodedData = btoa(JSON.stringify(data));
    const link = `${window.location.origin}${window.location.pathname}?palette=${encodedData}`;
    setGeneratedLink(link);
    return link;
  };

  const generateShareCode = () => {
    const data = generateShareData();
    const code = JSON.stringify(data, null, 2);
    setGeneratedCode(code);
    return code;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadShareFile = () => {
    const data = generateShareData();
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.name}-palette.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Share file downloaded!');
  };

  const handleGenerate = () => {
    if (shareMethod === 'link') {
      generateShareLink();
    } else {
      generateShareCode();
    }
  };

  const handleCopy = () => {
    if (shareMethod === 'link' && generatedLink) {
      copyToClipboard(generatedLink);
    } else if (shareMethod === 'code' && generatedCode) {
      copyToClipboard(generatedCode);
    }
  };

  if (colors.length === 0) {
    return (
      <div className="palette-share">
        <h3>Share Palette</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Select colors to share your palette
        </p>
      </div>
    );
  }

  return (
    <div className="palette-share">
      <h3>Share Palette</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Palette Name:
        </label>
        <input
          type="text"
          value={paletteName}
          onChange={(e) => setPaletteName(e.target.value)}
          placeholder="Enter palette name"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Share Method:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`share-method-btn ${shareMethod === 'link' ? 'active' : ''}`}
            onClick={() => setShareMethod('link')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: shareMethod === 'link' ? '#667eea' : '#ffffff',
              color: shareMethod === 'link' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiLink />
            Link
          </button>
          <button
            className={`share-method-btn ${shareMethod === 'code' ? 'active' : ''}`}
            onClick={() => setShareMethod('code')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: shareMethod === 'code' ? '#667eea' : '#ffffff',
              color: shareMethod === 'code' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiCode />
            Code
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          className="action-btn primary full-width"
          onClick={handleGenerate}
        >
          <FiShare2 />
          Generate {shareMethod === 'link' ? 'Link' : 'Code'}
        </button>
      </div>

      {shareMethod === 'link' && generatedLink && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Generated Link:
          </label>
          <div className="share-input">
            <input
              type="text"
              value={generatedLink}
              readOnly
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f8f9fa'
              }}
            />
            <button
              className="action-btn secondary"
              onClick={handleCopy}
            >
              <FiCopy />
              Copy
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
            Share this link with others to let them import your palette
          </div>
        </div>
      )}

      {shareMethod === 'code' && generatedCode && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Generated Code:
          </label>
          <textarea
            value={generatedCode}
            readOnly
            rows="6"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, monospace',
              background: '#f8f9fa',
              resize: 'vertical'
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              className="action-btn secondary"
              onClick={handleCopy}
            >
              <FiCopy />
              Copy Code
            </button>
            <button
              className="action-btn secondary"
              onClick={downloadShareFile}
            >
              <FiDownload />
              Download
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
            Share this code with others to let them import your palette
          </div>
        </div>
      )}

      <div style={{ 
        background: '#f8f9fa', 
        padding: '16px', 
        borderRadius: '8px', 
        border: '1px solid #e9ecef',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <strong>Sharing includes:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>All {colors.length} colors in your palette</li>
          <li>Palette name and metadata</li>
          <li>Import instructions for recipients</li>
        </ul>
      </div>
    </div>
  );
}
