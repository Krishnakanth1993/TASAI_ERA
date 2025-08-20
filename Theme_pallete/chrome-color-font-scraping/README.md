# 🎨 Chrome Color & Font Scraper Extension

A powerful Chrome extension designed for designers, developers, and anyone working with web aesthetics. Extract colors and fonts from any webpage, save them as themes, and apply them to other pages with granular control.

## ✨ Features

### 🔍 **Smart Extraction**
- **Color Detection**: Automatically extracts all unique colors from webpage elements
- **Font Discovery**: Identifies all fonts, sizes, weights, and styles used
- **Duplicate Removal**: Intelligent deduplication ensures only distinct colors and fonts are displayed
- **Real-time Processing**: Instant extraction from the active tab

### 💾 **Theme Management**
- **Save as Themes**: Create custom themes with selected colors and fonts
- **Theme Naming**: Give memorable names to your saved themes
- **Theme Library**: Organize and manage multiple themes in one place
- **Theme Details**: View comprehensive information about each saved theme

### 🎯 **Advanced Theme Application**
- **Selective Application**: Choose specific colors and fonts to apply
- **Multiple Selection**: Select multiple colors and fonts for variety
- **Bulk Selection**: Use "Select All" and "Deselect All" for quick selection
- **Application Options**: Choose where to apply your selections:
  - Page background and sections
  - Text elements
  - Buttons and form elements

### 🎨 **Smart Color Application**
- **Primary Color**: First selected color applied to main elements
- **Secondary Colors**: Additional colors distributed across different sections
- **Variety Distribution**: Colors are intelligently applied to create visual hierarchy
- **Background Styling**: Apply colors to page backgrounds and container sections

### 🔤 **Intelligent Font Application**
- **Primary Font**: First selected font applied to body text
- **Heading Fonts**: Different fonts applied to headings for variety
- **Text Elements**: Fonts distributed across paragraphs, spans, and other text elements
- **Style Preservation**: Maintains font weights and styles where appropriate

## 🚀 Installation

### Quick Start (No Building Required)

1. **Download the Extension**
   - Clone or download this repository
   - Navigate to the `chrome-color-font-scraping` folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-color-font-scraping` folder

3. **Start Using**
   - Click the extension icon in your toolbar
   - Navigate to any webpage
   - Click "Start Extraction" to begin

## 📖 Usage Guide

### **Step 1: Extract Colors and Fonts**
1. Navigate to any webpage you want to analyze
2. Click the extension icon to open the popup
3. Click "Start Extraction" button
4. Wait for the extraction to complete
5. View all extracted colors and fonts

### **Step 2: Select Elements to Save**
1. **Individual Selection**: Click on any color or font item to select/deselect it
2. **Bulk Selection**: Use "Select All" and "Deselect All" buttons for quick selection
3. **Visual Feedback**: Selected items show a checkmark and highlighted border
4. **Save as Theme**: Click "Save as Theme" button when ready

### **Step 3: Create and Name Your Theme**
1. Enter a memorable name for your theme
2. The extension checks for duplicate names (case-insensitive)
3. Your theme is saved with all selected colors and fonts
4. Success message confirms the save

### **Step 4: Apply Themes to Other Pages**
1. Go to the "Favorites" tab
2. Click on any saved theme to view details
3. Click "Apply Theme" button
4. **Select Elements to Apply**:
   - Choose specific colors and fonts from the theme
   - Use "Select All" and "Deselect All" for quick selection
   - Select application options (background, text, buttons)
5. Click "Apply Selected Elements" to apply to the current page

## 🎨 **Theme Application Options**

### **Color Application**
- **Background**: Applies primary color to page background, secondary colors to sections
- **Text**: Distributes colors across text elements for variety
- **Buttons**: Applies colors to buttons and form elements

### **Font Application**
- **Body**: Primary font applied to main text
- **Headings**: Different fonts applied to heading elements
- **Text Elements**: Fonts distributed across paragraphs and other text

## 🔧 Technical Details

### **Architecture**
- **Manifest V3**: Modern Chrome extension architecture
- **Content Scripts**: Execute in webpage context for extraction and application
- **Background Service Worker**: Handles extension lifecycle
- **Chrome Storage API**: Persistent theme storage with sync capability

### **Color Processing**
- **Format Support**: HEX, RGB, RGBA, and named colors
- **Deduplication**: Uses Map data structure for efficient unique color tracking
- **Conversion**: Automatic conversion to consistent HEX format

### **Font Processing**
- **Comprehensive Extraction**: Font family, size, weight, and style
- **Normalization**: Standardized font weight values
- **Unique Keys**: Combined properties for accurate deduplication

### **Performance Features**
- **Efficient DOM Traversal**: Recursive element processing
- **Memory Management**: Optimized data structures
- **Async Operations**: Non-blocking theme application

## 📱 **Responsive Design**

The extension popup is fully responsive with:
- **Base Width**: 408px (optimized for most displays)
- **Responsive Breakpoints**: Adapts to different screen sizes
- **Mobile Friendly**: Optimized for smaller popup dimensions
- **High DPI Support**: Crisp display on retina screens

## 🎯 **Use Cases**

### **For Designers**
- Extract color palettes from inspiring websites
- Analyze typography choices and combinations
- Create mood boards from web content
- Save design inspiration for future projects

### **For Developers**
- Understand website design systems
- Extract brand colors and fonts
- Analyze competitor design choices
- Create consistent design tokens

### **For Content Creators**
- Match website aesthetics
- Create cohesive visual content
- Understand design trends
- Build brand-consistent materials

## 🔒 **Privacy & Security**

- **Local Processing**: All extraction happens in your browser
- **No Data Collection**: No information is sent to external servers
- **Chrome Storage**: Uses Chrome's secure storage API
- **Permission Minimal**: Only requests necessary webpage access

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **"No colors extracted yet"**
   - Ensure you're on a webpage (not chrome:// pages)
   - Try refreshing the page and extracting again
   - Check if the page has dynamic content

2. **"Theme name already exists"**
   - Choose a different name for your theme
   - Check existing themes in the Favorites tab
   - Names are case-insensitive

3. **Theme not applying**
   - Ensure you've selected colors/fonts to apply
   - Check that application options are selected
   - Try refreshing the page after application

### **Performance Tips**
- Close unnecessary tabs for better performance
- Extract from simpler pages first to test
- Use bulk selection for large numbers of elements

## 🚀 **Future Enhancements**

- **Export Options**: Save themes as CSS, JSON, or design tokens
- **Theme Sharing**: Share themes with team members
- **Advanced Filters**: Filter by color families or font categories
- **Integration**: Connect with design tools and platforms
- **Analytics**: Track usage patterns and popular themes

## 🤝 **Contributing**

We welcome contributions! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 **License**

This project is open source and available under the MIT License.

## 🙏 **Acknowledgments**

- Built with modern web technologies
- Inspired by designer and developer workflows
- Powered by Chrome Extension APIs
- Community-driven development

---

**Happy Designing! 🎨✨**

*This extension helps you capture the beauty of the web, one color and font at a time.*
