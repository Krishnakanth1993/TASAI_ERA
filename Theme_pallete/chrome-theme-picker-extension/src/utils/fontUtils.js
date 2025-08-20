// Font extraction utilities

// Extract all unique fonts used in the DOM
export function getFontsFromDOM() {
  const fonts = {};
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const font = style.fontFamily;
    const weight = style.fontWeight;
    const fontStyle = style.fontStyle;
    if (font && font !== 'inherit' && font !== 'initial') {
      const key = `${font}|${weight}|${fontStyle}`;
      if (!fonts[key]) {
        fonts[key] = {
          name: font.split(',')[0].replace(/['"]/g, '').trim(),
          style: fontStyle,
          weight: weight,
          selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : '')
        };
      }
    }
  });
  return Object.values(fonts);
}

// Helper: Check if font is Google Font (basic check)
export function isGoogleFont(fontName) {
  // This is a stub. In production, check against Google Fonts API or list.
  const googleFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Poppins', 'Inter'];
  return googleFonts.includes(fontName);
}

// Helper: Get Google Fonts download link
export function getGoogleFontLink(fontName) {
  return `https://fonts.google.com/specimen/${encodeURIComponent(fontName)}`;
}
