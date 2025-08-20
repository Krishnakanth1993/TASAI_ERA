// Color conversion and manipulation utilities

// HEX to RGB: '#fff' or '#ffffff' -> [r,g,b]
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const num = parseInt(h, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255
  ];
}

// RGB to HEX: [r,g,b] -> '#rrggbb'
export function rgbToHex(r, g, b) {
  return (
    '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  );
}

// RGB to HSL: [r,g,b] -> [h,s,l]
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// RGB to CMYK: [r,g,b] -> [c,m,y,k] (0-100)
export function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
  let c = 1 - (r / 255), m = 1 - (g / 255), y = 1 - (b / 255);
  let k = Math.min(c, m, y);
  c = ((c - k) / (1 - k)) * 100;
  m = ((m - k) / (1 - k)) * 100;
  y = ((y - k) / (1 - k)) * 100;
  k = k * 100;
  return [Math.round(c), Math.round(m), Math.round(y), Math.round(k)];
}

// Formatters
export function formatRgb([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}
export function formatHsl([h, s, l]) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}
export function formatCmyk([c, m, y, k]) {
  return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}
