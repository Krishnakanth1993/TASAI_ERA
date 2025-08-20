import React, { useState, useEffect } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function ColorPicker({ currentColor, onColorChange, onColorPick }) {
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [colorFormats, setColorFormats] = useState({});

  useEffect(() => {
    if (currentColor) {
      generateColorFormats(currentColor);
    }
  }, [currentColor]);

  const generateColorFormats = (color) => {
    try {
      // Parse the color
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      
      // Get RGB values
      const rgb = ctx.fillStyle.match(/\d+/g);
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);

      // Generate different formats
      const formats = {
        hex: color.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, 1)`,
        hsl: rgbToHsl(r, g, b),
        hsla: rgbToHsl(r, g, b, 1),
        cmyk: rgbToCmyk(r, g, b)
      };

      setColorFormats(formats);
    } catch (error) {
      console.error('Error generating color formats:', error);
    }
  };

  const rgbToHsl = (r, g, b, a = 1) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return a === 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
  };

  const rgbToCmyk = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
  };

  const copyToClipboard = async (text, format) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      toast.success(`${format.toUpperCase()} copied!`);
      
      setTimeout(() => {
        setCopiedFormat(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleColorInputChange = (e) => {
    const newColor = e.target.value;
    onColorChange(newColor);
  };

  const handleColorPick = () => {
    onColorPick(currentColor);
  };

  return (
    <div className="color-picker-section">
      <h3>Color Picker</h3>
      
      <div className="color-preview">
        <div 
          className="color-swatch"
          style={{ backgroundColor: currentColor }}
          onClick={handleColorPick}
          title="Click to add to palette"
        />
        
        <div className="color-input">
          <input
            type="color"
            value={currentColor}
            onChange={handleColorInputChange}
            title="Select color"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#000000"
            title="Enter color value"
          />
        </div>
      </div>

      <div className="color-formats">
        {Object.entries(colorFormats).map(([format, value]) => (
          <div key={format} className="format-item">
            <span className="format-label">{format.toUpperCase()}</span>
            <span 
              className="format-value"
              onClick={() => copyToClipboard(value, format)}
              title={`Click to copy ${format.toUpperCase()}`}
            >
              {value}
            </span>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(value, format)}
              title={`Copy ${format.toUpperCase()}`}
            >
              {copiedFormat === format ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        ))}
      </div>

      <button 
        className="action-btn primary full-width"
        onClick={handleColorPick}
        style={{ marginTop: '16px' }}
      >
        Add to Palette
      </button>
    </div>
  );
}
