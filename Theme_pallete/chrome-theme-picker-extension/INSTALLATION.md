# Simple Installation Guide

## Quick Start (No Building Required)

This extension can be installed directly without building if you don't have Node.js installed.

### Method 1: Direct Installation

1. **Download the Extension**
   - Download this entire folder to your computer
   - Keep the folder structure intact

2. **Open Chrome Extensions**
   - Open Google Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-theme-picker-extension` folder
   - The extension should now appear in your extensions list

4. **Start Using**
   - Click the extension icon in your Chrome toolbar
   - Use the color picker, area snap, and other features

### Method 2: With Node.js (Advanced)

If you have Node.js installed and want to customize the extension:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load the Built Extension**
   - Load the `dist` folder instead of the source folder

## Features Available

### ✅ Working Features
- **Color Picker**: Click to pick colors from webpages
- **Color Formats**: View colors in HEX, RGB, HSL, RGBA, HSLA
- **Copy to Clipboard**: One-click copy for all color formats
- **Palette Generation**: Generate complementary color schemes
- **Basic UI**: Clean, modern interface inspired by Figma

### 🔄 Features Requiring Background Script
- **Area Snap**: Select webpage areas to extract colors
- **Font Inspection**: Analyze fonts used on webpages
- **Context Menu**: Right-click integration

## Troubleshooting

### Extension Not Loading
- Ensure you're using Chrome 88 or higher
- Check that all files are in the correct folder structure
- Try refreshing the extensions page

### Color Picker Not Working
- Some websites may block content scripts
- Try on different websites
- Check the browser console for errors

### Missing Features
- Some advanced features require the background script to be properly loaded
- Ensure the manifest.json file is correct
- Check that all permissions are granted

## File Structure

```
chrome-theme-picker-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Styling for the popup
├── src/
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts for webpage interaction
│   └── components/       # React components (for advanced builds)
└── README.md             # Detailed documentation
```

## Next Steps

1. **Test Basic Features**: Try the color picker and palette generation
2. **Customize Colors**: Modify the CSS to match your preferences
3. **Add Features**: Extend the functionality as needed
4. **Share**: Let others know about this useful tool!

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Ensure all files are properly loaded
3. Try reinstalling the extension
4. Check that Chrome is up to date

---

**Happy designing! 🎨✨**
