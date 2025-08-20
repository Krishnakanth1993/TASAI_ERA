import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function PaletteGenerator({ baseColor, onPaletteGenerated }) {
  const [generatedPalettes, setGeneratedPalettes] = useState({});
  const [activePalette, setActivePalette] = useState(null);

  useEffect(() => {
    if (baseColor) {
      generatePalettes(baseColor);
    }
  }, [baseColor]);

  const generatePalettes = (color) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      
      // Get RGB values
      const rgb = ctx.fillStyle.match(/\d+/g);
      const r = parseInt(rgb[0]);
      const g = parseInt(rgb[1]);
      const b = parseInt(rgb[2]);

      // Convert to HSL for easier manipulation
      const hsl = rgbToHsl(r, g, b);
      
      const palettes = {
        complementary: generateComplementaryPalette(hsl),
        analogous: generateAnalogousPalette(hsl),
        triadic: generateTriadicPalette(hsl),
        monochromatic: generateMonochromaticPalette(hsl),
        splitComplementary: generateSplitComplementaryPalette(hsl)
      };

      setGeneratedPalettes(palettes);
      setActivePalette('complementary');
    } catch (error) {
      console.error('Error generating palettes:', error);
    }
  };

  const rgbToHsl = (r, g, b) => {
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

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1) {
      r = c; g = x; b = 0;
    } else if (1 <= h && h < 2) {
      r = x; g = c; b = 0;
    } else if (2 <= h && h < 3) {
      r = 0; g = c; b = x;
    } else if (3 <= h && h < 4) {
      r = 0; g = x; b = c;
    } else if (4 <= h && h < 5) {
      r = x; g = 0; b = c;
    } else if (5 <= h && h < 6) {
      r = c; g = 0; b = x;
    }

    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const generateComplementaryPalette = (hsl) => {
    const colors = [];
    const baseHue = hsl.h;
    
    // Base color
    colors.push(hslToHex(baseHue, hsl.s, hsl.l));
    
    // Complementary color (180° opposite)
    const compHue = (baseHue + 180) % 360;
    colors.push(hslToHex(compHue, hsl.s, hsl.l));
    
    // Variations
    colors.push(hslToHex(baseHue, Math.max(0, hsl.s - 20), Math.max(0, hsl.l - 20)));
    colors.push(hslToHex(compHue, Math.max(0, hsl.s - 20), Math.max(0, hsl.l - 20)));
    colors.push(hslToHex(baseHue, Math.min(100, hsl.s + 20), Math.min(100, hsl.l + 20)));
    
    return colors;
  };

  const generateAnalogousPalette = (hsl) => {
    const colors = [];
    const baseHue = hsl.h;
    
    // Base color
    colors.push(hslToHex(baseHue, hsl.s, hsl.l));
    
    // Analogous colors (±30°)
    colors.push(hslToHex((baseHue + 30) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((baseHue - 30 + 360) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((baseHue + 60) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((baseHue - 60 + 360) % 360, hsl.s, hsl.l));
    
    return colors;
  };

  const generateTriadicPalette = (hsl) => {
    const colors = [];
    const baseHue = hsl.h;
    
    // Base color
    colors.push(hslToHex(baseHue, hsl.s, hsl.l));
    
    // Triadic colors (±120°)
    colors.push(hslToHex((baseHue + 120) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((baseHue + 240) % 360, hsl.s, hsl.l));
    
    // Variations
    colors.push(hslToHex(baseHue, Math.max(0, hsl.s - 15), Math.max(0, hsl.l - 15)));
    colors.push(hslToHex((baseHue + 120) % 360, Math.max(0, hsl.s - 15), Math.max(0, hsl.l - 15)));
    
    return colors;
  };

  const generateMonochromaticPalette = (hsl) => {
    const colors = [];
    const baseHue = hsl.h;
    const baseS = hsl.s;
    
    // Base color
    colors.push(hslToHex(baseHue, baseS, hsl.l));
    
    // Lighter variations
    colors.push(hslToHex(baseHue, baseS, Math.min(100, hsl.l + 20)));
    colors.push(hslToHex(baseHue, baseS, Math.min(100, hsl.l + 40)));
    
    // Darker variations
    colors.push(hslToHex(baseHue, baseS, Math.max(0, hsl.l - 20)));
    colors.push(hslToHex(baseHue, baseS, Math.max(0, hsl.l - 40)));
    
    return colors;
  };

  const generateSplitComplementaryPalette = (hsl) => {
    const colors = [];
    const baseHue = hsl.h;
    
    // Base color
    colors.push(hslToHex(baseHue, hsl.s, hsl.l));
    
    // Split complementary colors (±150°)
    colors.push(hslToHex((baseHue + 150) % 360, hsl.s, hsl.l));
    colors.push(hslToHex((baseHue + 210) % 360, hsl.s, hsl.l));
    
    // Variations
    colors.push(hslToHex(baseHue, Math.max(0, hsl.s - 25), Math.max(0, hsl.l - 25)));
    colors.push(hslToHex((baseHue + 150) % 360, Math.max(0, hsl.s - 25), Math.max(0, hsl.l - 25)));
    
    return colors;
  };

  const handlePaletteSelect = (paletteType) => {
    setActivePalette(paletteType);
  };

  const handleUsePalette = () => {
    if (activePalette && generatedPalettes[activePalette]) {
      const colors = generatedPalettes[activePalette].map(color => ({ color, timestamp: Date.now() }));
      onPaletteGenerated(colors);
      toast.success(`${activePalette} palette applied!`);
    }
  };

  const copyPaletteToClipboard = async () => {
    if (activePalette && generatedPalettes[activePalette]) {
      const paletteText = generatedPalettes[activePalette].join('\n');
      try {
        await navigator.clipboard.writeText(paletteText);
        toast.success(`${activePalette} palette copied!`);
      } catch (error) {
        toast.error('Failed to copy palette');
      }
    }
  };

  if (!baseColor || Object.keys(generatedPalettes).length === 0) {
    return (
      <div className="palette-generator">
        <h3>Palette Generator</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Select a base color to generate palettes
        </p>
      </div>
    );
  }

  return (
    <div className="palette-generator">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Generated Palettes</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="action-btn secondary"
            onClick={() => generatePalettes(baseColor)}
            title="Regenerate palettes"
          >
            <FiRefreshCw />
            Regenerate
          </button>
          <button
            className="action-btn primary"
            onClick={handleUsePalette}
            title="Use selected palette"
          >
            Use Palette
          </button>
        </div>
      </div>

      <div className="palette-tabs" style={{ marginBottom: '16px' }}>
        {Object.keys(generatedPalettes).map((paletteType) => (
          <button
            key={paletteType}
            className={`palette-tab ${activePalette === paletteType ? 'active' : ''}`}
            onClick={() => handlePaletteSelect(paletteType)}
            style={{
              padding: '8px 16px',
              margin: '0 4px 4px 0',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activePalette === paletteType ? '#667eea' : '#ffffff',
              color: activePalette === paletteType ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize'
            }}
          >
            {paletteType}
          </button>
        ))}
      </div>

      {activePalette && generatedPalettes[activePalette] && (
        <div className="generated-palette">
          <div className="palette-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ textTransform: 'capitalize', margin: 0 }}>{activePalette} Palette</h4>
            <button
              className="action-btn secondary"
              onClick={copyPaletteToClipboard}
              title="Copy palette"
            >
              <FiCopy />
              Copy
            </button>
          </div>
          
          <div className="palette-grid">
            {generatedPalettes[activePalette].map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="palette-color"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
