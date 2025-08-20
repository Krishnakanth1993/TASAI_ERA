import React from 'react';
import { FiClock, FiTrash2 } from 'react-icons/fi';

export default function ColorHistory({ colors, onColorSelect, onCopyColor }) {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleColorClick = (color) => {
    onColorSelect(color);
  };

  const handleCopyColor = (e, color) => {
    e.stopPropagation();
    onCopyColor(color);
  };

  if (colors.length === 0) {
    return (
      <div className="color-history">
        <h3>
          <FiClock />
          Color History
        </h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No colors picked yet. Use the color picker or snap area to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="color-history">
      <h3>
        <FiClock />
        Color History ({colors.length})
      </h3>
      
      <div className="history-grid">
        {colors.map((colorObj, index) => {
          const color = typeof colorObj === 'string' ? colorObj : colorObj.color;
          const timestamp = typeof colorObj === 'string' ? Date.now() : colorObj.timestamp;
          
          return (
            <div
              key={`${color}-${timestamp}`}
              className="history-color"
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={`${color} - ${formatTimestamp(timestamp)}`}
            />
          );
        })}
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
        Click any color to select it
      </div>
    </div>
  );
}
