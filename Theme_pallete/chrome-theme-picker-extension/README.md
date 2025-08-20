# Figma Palette & Color Picker Chrome Extension

A professional design tool for designers and developers that provides comprehensive color picking, palette generation, font inspection, and theme creation capabilities directly in your browser.

## ✨ Features

### 🎨 Color Picker Tool
- **Eyedropper Selection**: Click anywhere on a webpage to pick colors
- **Multiple Formats**: View colors in HEX, RGB, HSL, CMYK formats
- **One-Click Copy**: Copy any color format to clipboard instantly
- **Color History**: Keep track of all picked colors with timestamps

### 📸 Webpage Area Snap & Palette Generation
- **Area Selection**: Select rectangular areas to extract dominant colors
- **Smart Sampling**: Automatically analyzes selected areas for color extraction
- **Instant Palettes**: Generate beautiful color palettes from any webpage section

### 🎯 Color Code Support
- **Multiple Formats**: HEX, RGB, HSL, CMYK, RGBA, HSLA
- **Accessibility Info**: WCAG compliance checking and contrast analysis
- **Professional Tools**: Built-in color theory and palette generation

### 🌈 Automatic Theme Generation
- **Smart Palettes**: Generate complementary, analogous, triadic, and monochromatic schemes
- **Theme Preview**: See how your colors look in different UI layouts
- **Light/Dark Modes**: Preview themes in both light and dark variants

### 💾 Palette Customization & Saving
- **Custom Palettes**: Create, edit, and organize your color collections
- **Project Organization**: Tag and categorize palettes by project or client
- **Chrome Sync**: Access your palettes across all devices
- **Import/Export**: Share palettes with team members

### 🔤 Font Inventory & Download
- **Page Analysis**: Automatically detect all fonts used on any webpage
- **Google Fonts Integration**: Direct links to download fonts when available
- **Font Preview**: See how fonts look in different sizes and weights
- **Copy & Download**: Easy access to font information and downloads

### 🛠️ Additional Tools
- **Accessibility Audit**: WCAG compliance checking for color combinations
- **Export Support**: Export palettes in JSON, CSS, SCSS, ASE, and TXT formats
- **Palette Sharing**: Generate shareable links and codes for collaboration
- **Context Menu**: Right-click integration for quick access to tools

## 🚀 Installation

### Prerequisites
- Google Chrome browser (version 88 or higher)
- Node.js (version 16 or higher) for development

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chrome-theme-picker-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

### Production Installation

1. **Download the extension**
   - Download the latest release from the releases page
   - Extract the ZIP file

2. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extracted folder

## 📖 Usage Guide

### Getting Started

1. **Open the Extension**
   - Click the extension icon in your Chrome toolbar
   - The popup will open with the main interface

2. **Pick Colors from Webpages**
   - Click the "Pick Color" button
   - Click anywhere on the current webpage
   - The color will be added to your palette

3. **Snap Areas for Palettes**
   - Click "Snap Area" to select a webpage section
   - Drag to create a selection rectangle
   - Colors will be automatically extracted and added

### Working with Palettes

1. **View Your Colors**
   - All picked colors appear in the "Colors" tab
   - Click any color to select it as the current color
   - View color history and recently picked colors

2. **Generate New Palettes**
   - Use the "Palettes" tab to access palette tools
   - Click "Generate Theme" to create new color schemes
   - Choose from complementary, analogous, triadic, and more

3. **Save and Organize**
   - Give your palette a name and save it
   - Organize palettes by project or client
   - Access saved palettes across all your devices

### Font Inspection

1. **Analyze Page Fonts**
   - Go to any webpage
   - Click "Inspect Page Fonts" in the Fonts tab
   - View all fonts used on the page

2. **Download and Preview**
   - Click on any font to preview it
   - Use Google Fonts links to download fonts
   - Copy font names for use in your projects

### Theme Preview

1. **Preview Your Colors**
   - Go to the "Themes" tab
   - Choose between light and dark themes
   - Select different UI layouts (cards, dashboards, forms)

2. **See Real Examples**
   - View how your colors look in actual UI components
   - Test different color combinations
   - Ensure accessibility and visual appeal

### Export and Share

1. **Export Palettes**
   - Use the "Tools" tab to access export options
   - Choose from JSON, CSS, SCSS, ASE, or TXT formats
   - Download files or copy to clipboard

2. **Share with Others**
   - Generate shareable links for your palettes
   - Create export codes for easy sharing
   - Collaborate with team members

## 🏗️ Development

### Project Structure
```
chrome-theme-picker-extension/
├── src/
│   ├── components/          # React components
│   ├── popup/              # Extension popup interface
│   ├── background/         # Background service worker
│   ├── content/            # Content scripts for webpage interaction
│   ├── options/            # Extension options page
│   ├── utils/              # Utility functions
│   └── styles/             # CSS and styling
├── dist/                   # Built extension files
├── webpack.config.js       # Webpack configuration
└── package.json            # Dependencies and scripts
```

### Available Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in development mode with watch
- `npm run start` - Start development server
- `npm run clean` - Clean build directory

### Building for Production

1. **Build the extension**
   ```bash
   npm run build
   ```

2. **Load in Chrome**
   - The built files will be in the `dist` folder
   - Load this folder as an unpacked extension

### Development Workflow

1. **Make changes** to source files
2. **Run dev build** with `npm run dev`
3. **Reload extension** in Chrome extensions page
4. **Test changes** in the extension

## 🔧 Configuration

### Manifest Settings
The extension uses Manifest V3 with the following permissions:
- `activeTab` - Access to current tab
- `storage` - Save palettes and settings
- `clipboardWrite` - Copy colors to clipboard
- `contextMenus` - Right-click menu integration
- `tabs` - Tab management

### Customization
- Modify colors and themes in `src/styles/variables.css`
- Update component styles in individual component files
- Configure webpack settings in `webpack.config.js`

## 🐛 Troubleshooting

### Common Issues

1. **Extension not loading**
   - Ensure you're using Chrome 88+
   - Check that all dependencies are installed
   - Verify the build completed successfully

2. **Color picker not working**
   - Check that the content script is injected
   - Ensure the webpage allows content scripts
   - Try refreshing the page

3. **Font inspection issues**
   - Some websites may block font detection
   - Try on different websites
   - Check browser console for errors

### Debug Mode

1. **Enable developer mode** in Chrome extensions
2. **Click "background page"** to open service worker console
3. **Check console logs** for error messages
4. **Reload extension** after making changes

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and modern web technologies
- Inspired by Figma's design tools and interface
- Uses various open-source libraries and tools
- Community feedback and contributions

## 📞 Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check this README and inline code comments
- **Contributing**: Help improve the extension

---

**Happy designing! 🎨✨**