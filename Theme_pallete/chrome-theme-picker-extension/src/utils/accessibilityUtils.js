// Accessibility and contrast utilities

// Helper: Parse hex/rgb color to [r,g,b] (0-255)
function parseColor(input) {
  if (typeof input === 'string') {
    if (input.startsWith('#')) {
      let hex = input.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const num = parseInt(hex, 16);
      return [
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255
      ];
    } else if (input.startsWith('rgb')) {
      const vals = input.match(/\d+/g);
      return vals ? vals.slice(0,3).map(Number) : [0,0,0];
    }
  }
  return [0,0,0];
}

// Calculate relative luminance (per WCAG)
function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}

// Contrast ratio between two colors (1-21)
export function getContrastRatio(color1, color2) {
  const lum1 = luminance(parseColor(color1));
  const lum2 = luminance(parseColor(color2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
}

// WCAG compliance: AA/AAA for normal/large text
export function checkWCAGCompliance(contrast) {
  const c = typeof contrast === 'number' ? contrast : parseFloat(contrast);
  return {
    AA: c >= 4.5 ? 'Pass' : 'Fail',
    AA_Large: c >= 3 ? 'Pass' : 'Fail',
    AAA: c >= 7 ? 'Pass' : 'Fail',
    AAA_Large: c >= 4.5 ? 'Pass' : 'Fail'
  };
}

// Simulate color blindness (protanopia, deuteranopia, tritanopia)
export function simulateColorBlindness(rgb, type = 'protanopia') {
  // Accepts [r,g,b] (0-255)
  // Returns [r,g,b] (0-255) simulated
  // Matrices from https://www.color-blindness.com/coblis-color-blindness-simulator/
  const matrices = {
    protanopia: [
      [0.56667, 0.43333, 0],
      [0.55833, 0.44167, 0],
      [0, 0.24167, 0.75833]
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7]
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.43333, 0.56667],
      [0, 0.475, 0.525]
    ]
  };
  const m = matrices[type] || matrices.protanopia;
  const [r, g, b] = rgb;
  return [
    Math.round(r * m[0][0] + g * m[0][1] + b * m[0][2]),
    Math.round(r * m[1][0] + g * m[1][1] + b * m[1][2]),
    Math.round(r * m[2][0] + g * m[2][1] + b * m[2][2])
  ];
}
