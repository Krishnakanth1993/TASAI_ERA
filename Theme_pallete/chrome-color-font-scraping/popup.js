// DOM Elements
const extractBtn = document.getElementById('extract-btn');
const statusDiv = document.getElementById('status');
const colorCount = document.getElementById('color-count');
const fontCount = document.getElementById('font-count');
const colorsContainer = document.getElementById('colors-container');
const fontsContainer = document.getElementById('fonts-container');
const saveColorsBtn = document.getElementById('save-colors-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const savedColorsContainer = document.getElementById('saved-colors-container');
const savedFontsContainer = document.getElementById('saved-fonts-container');

// Selection controls
const colorSelectionControls = document.getElementById('color-selection-controls');
const fontSelectionControls = document.getElementById('font-selection-controls');
const selectAllColorsBtn = document.getElementById('select-all-colors');
const deselectAllColorsBtn = document.getElementById('deselect-all-colors');
const selectAllFontsBtn = document.getElementById('select-all-fonts');
const deselectAllFontsBtn = document.getElementById('deselect-all-fonts');
const applyThemeBtn = document.getElementById('apply-theme-btn');

// Theme application controls
const themeApplicationSection = document.getElementById('theme-application-section');
const themeApplyColorsGrid = document.getElementById('theme-apply-colors-grid');
const themeApplyFontsList = document.getElementById('theme-apply-fonts-list');
const applySelectedThemeBtn = document.getElementById('apply-selected-theme-btn');
const applyToBackground = document.getElementById('apply-to-background');
const applyToText = document.getElementById('apply-to-text');
const applyToButtons = document.getElementById('apply-to-buttons');
const selectAllThemeColorsBtn = document.getElementById('select-all-theme-colors');
const deselectAllThemeColorsBtn = document.getElementById('deselect-all-theme-colors');
const selectAllThemeFontsBtn = document.getElementById('select-all-theme-fonts');
const deselectAllThemeFontsBtn = document.getElementById('deselect-all-theme-fonts');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let extractedColors = [];
let extractedFonts = [];
let savedThemes = [];
let currentThemeName = '';
let selectedColors = new Set();
let selectedFonts = new Set();
let currentThemeForApplication = null;
let selectedThemeColors = new Set();
let selectedThemeFonts = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadSavedData();
    setupEventListeners();
    updateCounts();
    renderSavedData();
    
    // Ensure colors container starts without has-colors class
    colorsContainer.classList.remove('has-colors');
    fontsContainer.classList.remove('has-fonts');
});

// Event Listeners
function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Extract button
    extractBtn.addEventListener('click', startExtraction);

    // Save theme button
    saveColorsBtn.addEventListener('click', saveTheme);

    // Clear all button
    clearAllBtn.addEventListener('click', clearAllFavorites);

    // Selection control buttons
    selectAllColorsBtn.addEventListener('click', () => selectAllColors());
    deselectAllColorsBtn.addEventListener('click', () => deselectAllColors());
    selectAllFontsBtn.addEventListener('click', () => selectAllFonts());
    deselectAllFontsBtn.addEventListener('click', () => deselectAllFonts());

    // Apply theme button
    applyThemeBtn.addEventListener('click', showThemeApplicationSelection);
    
    // Apply selected theme elements button
    applySelectedThemeBtn.addEventListener('click', applySelectedThemeElements);
    
    // Theme application selection control buttons
    selectAllThemeColorsBtn.addEventListener('click', selectAllThemeColors);
    deselectAllThemeColorsBtn.addEventListener('click', deselectAllThemeColors);
    selectAllThemeFontsBtn.addEventListener('click', selectAllThemeFonts);
    deselectAllThemeFontsBtn.addEventListener('click', deselectAllThemeFonts);
}

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// Extraction Logic
async function startExtraction() {
    try {
        updateStatus('Starting extraction...', 'loading');
        extractBtn.disabled = true;

        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Execute content script to extract data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractColorsAndFonts
        });

        if (results && results[0] && results[0].result) {
            const { colors, fonts } = results[0].result;
            
            extractedColors = colors;
            extractedFonts = fonts;
            
            renderExtractedData();
            updateCounts();
            updateStatus(`Extracted ${colors.length} colors and ${fonts.length} fonts!`, 'success');
        } else {
            throw new Error('Extraction failed');
        }

    } catch (error) {
        console.error('Extraction error:', error);
        updateStatus('Extraction failed. Please try again.', 'error');
    } finally {
        extractBtn.disabled = false;
    }
}

// Content Script Functions (executed in webpage context)
function applySelectedThemeElementsToPage(selectedColors, selectedFonts, applicationOptions) {
    console.log('Applying selected theme elements to page:', { selectedColors, selectedFonts, applicationOptions });
    
    // Apply multiple colors to various elements
    if (selectedColors && selectedColors.length > 0) {
        // Use first color for primary elements, others for variety
        const primaryColor = selectedColors[0];
        const secondaryColors = selectedColors.slice(1);
        
        if (applicationOptions.applyToBackground) {
            // Apply primary color to body background
            document.body.style.backgroundColor = primaryColor.hex;
            
            // Apply secondary colors to different sections
            const sections = document.querySelectorAll('section, div[class*="section"], div[class*="container"]');
            sections.forEach((section, index) => {
                if (secondaryColors[index % secondaryColors.length]) {
                    section.style.backgroundColor = secondaryColors[index % secondaryColors.length].hex;
                }
            });
        }
        
        if (applicationOptions.applyToText) {
            // Apply colors to text elements with variety
            const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
            textElements.forEach((element, index) => {
                if (element.style.color === '' || element.style.color === 'inherit') {
                    const colorIndex = index % selectedColors.length;
                    element.style.color = selectedColors[colorIndex].hex;
                }
            });
        }
        
        if (applicationOptions.applyToButtons) {
            // Apply colors to buttons and form elements
            const buttonElements = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
            buttonElements.forEach((element, index) => {
                const colorIndex = index % selectedColors.length;
                element.style.backgroundColor = selectedColors[colorIndex].hex;
                element.style.color = '#ffffff';
            });
        }
    }
    
    // Apply multiple fonts to various elements
    if (selectedFonts && selectedFonts.length > 0) {
        // Use first font for body, others for headings
        const primaryFont = selectedFonts[0];
        const secondaryFonts = selectedFonts.slice(1);
        
        // Apply primary font to body
        document.body.style.fontFamily = primaryFont.name;
        document.body.style.fontSize = primaryFont.size;
        document.body.style.fontWeight = primaryFont.weight;
        document.body.style.fontStyle = primaryFont.style;
        
        // Apply different fonts to headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            const fontIndex = index % selectedFonts.length;
            const font = selectedFonts[fontIndex];
            heading.style.fontFamily = font.name;
            heading.style.fontWeight = font.weight;
            heading.style.fontSize = font.size;
        });
        
        // Apply fonts to other text elements
        const textElements = document.querySelectorAll('p, span, div, a');
        textElements.forEach((element, index) => {
            const fontIndex = index % selectedFonts.length;
            const font = selectedFonts[fontIndex];
            element.style.fontFamily = font.name;
        });
    }
    
    console.log('Selected theme elements applied successfully');
}

function applyThemeToPageContent(theme) {
    console.log('Applying theme to page:', theme);
    
    // Apply colors to various elements
    if (theme.colors && theme.colors.length > 0) {
        const color = theme.colors[0]; // Use first color as primary
        
        // Apply to body background
        document.body.style.backgroundColor = color.hex;
        
        // Apply to various text elements
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
        textElements.forEach(element => {
            if (element.style.color === '' || element.style.color === 'inherit') {
                element.style.color = color.hex;
            }
        });
        
        // Apply to buttons and form elements
        const buttonElements = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        buttonElements.forEach(element => {
            element.style.backgroundColor = color.hex;
            element.style.color = '#ffffff';
        });
    }
    
    // Apply fonts to various elements
    if (theme.fonts && theme.fonts.length > 0) {
        const font = theme.fonts[0]; // Use first font as primary
        
        const fontFamily = font.name;
        const fontSize = font.size;
        const fontWeight = font.weight;
        const fontStyle = font.style;
        
        // Apply to body
        document.body.style.fontFamily = fontFamily;
        document.body.style.fontSize = fontSize;
        document.body.style.fontWeight = fontWeight;
        document.body.style.fontStyle = fontStyle;
        
        // Apply to headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.style.fontFamily = fontFamily;
            heading.style.fontWeight = fontWeight;
        });
        
        // Apply to paragraphs and text
        const textElements = document.querySelectorAll('p, span, div, a');
        textElements.forEach(element => {
            element.style.fontFamily = fontFamily;
        });
    }
    
    console.log('Theme applied successfully');
}

function extractColorsAndFonts() {
    const colorMap = new Map(); // Use Map to track unique colors by hex value
    const fontMap = new Map();  // Use Map to track unique fonts by key
    
    // Helper function to convert color to hex
    function colorToHex(color) {
        if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'inherit') {
            return null;
        }
        
        // Handle hex colors
        if (color.startsWith('#')) {
            return color.toLowerCase();
        }
        
        // Handle rgb/rgba colors
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            }
        }
        
        // Handle named colors
        try {
            const tempDiv = document.createElement('div');
            tempDiv.style.color = color;
            document.body.appendChild(tempDiv);
            const computedColor = window.getComputedStyle(tempDiv).color;
            document.body.removeChild(tempDiv);
            
            if (computedColor.startsWith('rgb')) {
                const rgb = computedColor.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const r = parseInt(rgb[0]);
                    const g = parseInt(rgb[1]);
                    const b = parseInt(rgb[2]);
                    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                }
            }
        } catch (e) {
            console.warn('Failed to convert color:', color, e);
        }
        
        return null;
    }
    
    // Extract colors from computed styles
    function extractColorsFromElement(element) {
        const styles = window.getComputedStyle(element);
        const colorProps = [
            'color', 
            'background-color', 
            'border-color',
            'border-top-color',
            'border-right-color',
            'border-bottom-color',
            'border-left-color',
            'outline-color',
            'text-decoration-color'
        ];
        
        colorProps.forEach(prop => {
            const value = styles.getPropertyValue(prop);
            const hex = colorToHex(value);
            
            if (hex) {
                // Only add if we don't already have this hex color
                if (!colorMap.has(hex)) {
                    colorMap.set(hex, {
                        original: value,
                        hex: hex
                    });
                }
            }
        });
    }
    
    // Extract fonts from computed styles
    function extractFontsFromElement(element) {
        const styles = window.getComputedStyle(element);
        const fontFamily = styles.getPropertyValue('font-family');
        const fontSize = styles.getPropertyValue('font-size');
        const fontWeight = styles.getPropertyValue('font-weight');
        const fontStyle = styles.getPropertyValue('font-style');
        
        if (fontFamily && fontFamily !== 'inherit') {
            // Clean font name and create unique key
            const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            
            // Normalize font weight for better grouping
            let normalizedWeight = fontWeight;
            if (fontWeight === '400' || fontWeight === 'normal') normalizedWeight = '400';
            if (fontWeight === '700' || fontWeight === 'bold') normalizedWeight = '700';
            
            // Create unique key including font style
            const fontKey = `${fontName.toLowerCase()}-${fontSize}-${normalizedWeight}-${fontStyle}`;
            
            // Only add if we don't already have this font combination
            if (!fontMap.has(fontKey)) {
                fontMap.set(fontKey, {
                    name: fontName,
                    size: fontSize,
                    weight: normalizedWeight,
                    style: fontStyle
                });
            }
        }
    }
    
    // Recursively process all elements
    function processElement(element) {
        if (element.nodeType === Node.ELEMENT_NODE) {
            extractColorsFromElement(element);
            extractFontsFromElement(element);
            
            // Process children
            Array.from(element.children).forEach(processElement);
        }
    }
    
    // Start processing from body
    processElement(document.body);
    
    // Convert maps to arrays
    const colorArray = Array.from(colorMap.values());
    const fontArray = Array.from(fontMap.values());
    
    return {
        colors: colorArray,
        fonts: fontArray
    };
}

// Selection Functions
function selectAllColors() {
    selectedColors.clear();
    extractedColors.forEach((_, index) => selectedColors.add(index));
    renderColors();
    updateSelectionControls();
}

function deselectAllColors() {
    selectedColors.clear();
    renderColors();
    updateSelectionControls();
}

function selectAllFonts() {
    selectedFonts.clear();
    extractedFonts.forEach((_, index) => selectedFonts.add(index));
    renderFonts();
    updateSelectionControls();
}

function deselectAllFonts() {
    selectedFonts.clear();
    renderFonts();
    updateSelectionControls();
}

function updateSelectionControls() {
    const hasColors = extractedColors.length > 0;
    const hasFonts = extractedFonts.length > 0;
    
    colorSelectionControls.style.display = hasColors ? 'flex' : 'none';
    fontSelectionControls.style.display = hasFonts ? 'flex' : 'none';
    
    // Show/hide save theme button based on selections
    const hasSelections = selectedColors.size > 0 || selectedFonts.size > 0;
    saveColorsBtn.style.display = hasSelections ? 'block' : 'none';
}

// Rendering Functions
function renderExtractedData() {
    renderColors();
    renderFonts();
    updateSelectionControls();
}

function renderColors() {
    if (extractedColors.length === 0) {
        colorsContainer.innerHTML = '<div class="empty-state">No colors extracted yet</div>';
        colorsContainer.classList.remove('has-colors');
        return;
    }
    
    colorsContainer.classList.add('has-colors');
    colorsContainer.innerHTML = extractedColors.map((color, index) => `
        <div class="color-item ${selectedColors.has(index) ? 'selected' : ''}" data-index="${index}">
            <div class="selection-checkbox"></div>
            <div class="color-preview" style="background-color: ${color.hex}"></div>
            <div class="color-hex">${color.hex}</div>
        </div>
    `).join('');
    
    // Add click events for selection
    colorsContainer.querySelectorAll('.color-item').forEach(item => {
        item.addEventListener('click', () => toggleColorSelection(parseInt(item.dataset.index)));
    });
}

function toggleColorSelection(index) {
    if (selectedColors.has(index)) {
        selectedColors.delete(index);
    } else {
        selectedColors.add(index);
    }
    renderColors();
    updateSelectionControls();
}

function renderFonts() {
    if (extractedFonts.length === 0) {
        fontsContainer.innerHTML = '<div class="empty-state">No fonts extracted yet</div>';
        fontsContainer.classList.remove('has-fonts');
        return;
    }
    
    fontsContainer.classList.add('has-fonts');
    fontsContainer.innerHTML = extractedFonts.map((font, index) => `
        <div class="font-item ${selectedFonts.has(index) ? 'selected' : ''}" data-index="${index}">
            <div class="selection-checkbox"></div>
            <div class="font-name">${font.name}</div>
            <div class="font-details">
                <span>Weight: ${font.weight}</span>
                <span class="font-size">${font.size}</span>
                ${font.style && font.style !== 'normal' ? `<span class="font-style">${font.style}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    // Add click events for selection
    fontsContainer.querySelectorAll('.font-item').forEach(item => {
        item.addEventListener('click', () => toggleFontSelection(parseInt(item.dataset.index)));
    });
}

function toggleFontSelection(index) {
    if (selectedFonts.has(index)) {
        selectedFonts.delete(index);
    } else {
        selectedFonts.add(index);
    }
    renderFonts();
    updateSelectionControls();
}

function renderSavedData() {
    renderSavedThemes();
}

function renderSavedThemes() {
    console.log('renderSavedThemes called, savedThemes:', savedThemes);
    console.log('savedColorsContainer:', savedColorsContainer);
    console.log('savedFontsContainer:', savedFontsContainer);
    
    if (savedThemes.length === 0) {
        console.log('No saved themes, showing empty state');
        savedColorsContainer.innerHTML = '<div class="empty-state">No saved themes yet</div>';
        savedFontsContainer.innerHTML = '<div class="empty-state">No saved themes yet</div>';
        applyThemeBtn.style.display = 'none';
        return;
    }
    
    console.log('Rendering themes:', savedThemes.length);
    
    // Render theme list
    savedColorsContainer.innerHTML = savedThemes.map((theme, index) => `
        <div class="theme-item" data-theme-index="${index}">
            <div class="theme-header">
                <h4 class="theme-name">${theme.name}</h4>
                <span class="theme-count">${theme.colors.length} colors, ${theme.fonts.length} fonts</span>
            </div>
            <div class="theme-preview">
                <div class="theme-colors">
                    ${theme.colors.slice(0, 3).map(color => `
                        <div class="mini-color" style="background-color: ${color.hex}"></div>
                    `).join('')}
                    ${theme.colors.length > 3 ? `<span class="more-indicator">+${theme.colors.length - 3}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click events to view theme details
    savedColorsContainer.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', () => viewThemeDetails(parseInt(item.dataset.themeIndex)));
    });
    
    // Clear fonts container as it's now used for theme details
    savedFontsContainer.innerHTML = '';
    
    // Hide apply button and application section initially
    applyThemeBtn.style.display = 'none';
    themeApplicationSection.style.display = 'none';
    currentThemeForApplication = null;
}



// Save/Remove Functions
function saveTheme() {
    console.log('saveTheme called, savedThemes:', savedThemes);
    console.log('selectedColors:', selectedColors);
    console.log('selectedFonts:', selectedFonts);
    
    if (selectedColors.size === 0 && selectedFonts.size === 0) {
        updateStatus('Please select colors and/or fonts to save!', 'error');
        return;
    }
    
    // Prompt for theme name
    const themeName = prompt('Enter a name for this theme:');
    if (!themeName || themeName.trim() === '') {
        updateStatus('Theme name is required!', 'error');
        return;
    }
    
    // Check if theme name already exists (case-insensitive)
    const existingTheme = savedThemes.find(theme => 
        theme.name.toLowerCase() === themeName.toLowerCase()
    );
    
    console.log('Checking for existing theme:', themeName, 'existingTheme:', existingTheme);
    
    if (existingTheme) {
        updateStatus('Theme name already exists!', 'error');
        return;
    }
    
    // Get selected colors and fonts
    const selectedColorsArray = Array.from(selectedColors).map(index => extractedColors[index]);
    const selectedFontsArray = Array.from(selectedFonts).map(index => extractedFonts[index]);
    
    // Create new theme
    const newTheme = {
        id: Date.now(),
        name: themeName.trim(),
        colors: selectedColorsArray,
        fonts: selectedFontsArray,
        createdAt: new Date().toISOString()
    };
    
    console.log('Creating new theme:', newTheme);
    
    // Add to saved themes
    savedThemes.push(newTheme);
    
    // Save to storage
    saveToStorage();
    
    // Update UI
    renderSavedData();
    updateStatus(`Theme "${themeName}" saved successfully!`, 'success');
    
    // Clear selections after saving
    selectedColors.clear();
    selectedFonts.clear();
    renderColors();
    renderFonts();
    updateSelectionControls();
}

function viewThemeDetails(themeIndex) {
    const theme = savedThemes[themeIndex];
    if (!theme) return;
    
    // Set current theme for application
    currentThemeForApplication = theme;
    
         // Reset selections for this theme
     console.log('Resetting theme selections');
     selectedThemeColors.clear();
     selectedThemeFonts.clear();
     console.log('Selections cleared. Colors:', selectedThemeColors.size, 'Fonts:', selectedThemeFonts.size);
    
    // Hide the theme application section when viewing a new theme
    themeApplicationSection.style.display = 'none';
    
    // Show theme details in the fonts container with selection capabilities
    savedFontsContainer.innerHTML = `
        <div class="theme-details">
            <div class="theme-details-header">
                <h3>${theme.name}</h3>
                <button class="danger-btn" onclick="deleteTheme(${themeIndex})">
                    <span class="btn-icon">🗑️</span>
                    Delete Theme
                </button>
            </div>
            
            <div class="theme-colors-section">
                <h4>Colors (${theme.colors.length})</h4>
                <div class="selection-controls">
                    <button class="mini-btn" onclick="selectAllThemeColorsFromDetails()">Select All</button>
                    <button class="mini-btn" onclick="deselectAllThemeColorsFromDetails()">Deselect All</button>
                </div>
                                 <div class="colors-grid has-colors">
                     ${theme.colors.map((color, index) => `
                         <div class="color-item ${selectedThemeColors.has(index) ? 'selected' : ''}" data-color-index="${index}">
                             <div class="selection-checkbox"></div>
                             <div class="color-preview" style="background-color: ${color.hex}"></div>
                             <div class="color-hex">${color.hex}</div>
                         </div>
                     `).join('')}
                 </div>
            </div>
            
            <div class="theme-fonts-section">
                <h4>Fonts (${theme.fonts.length})</h4>
                <div class="selection-controls">
                    <button class="mini-btn" onclick="selectAllThemeFontsFromDetails()">Select All</button>
                    <button class="mini-btn" onclick="deselectAllThemeFontsFromDetails()">Deselect All</button>
                </div>
                                 <div class="fonts-list has-fonts">
                     ${theme.fonts.map((font, index) => `
                         <div class="font-item ${selectedThemeFonts.has(index) ? 'selected' : ''}" data-font-index="${index}">
                             <div class="selection-checkbox"></div>
                             <div class="font-name">${font.name}</div>
                             <div class="font-details">
                                 <span>Weight: ${font.weight}</span>
                                 <span class="font-size">${font.size}</span>
                                 ${font.style && font.style !== 'normal' ? `<span class="font-style">${font.style}</span>` : ''}
                             </div>
                         </div>
                     `).join('')}
                 </div>
            </div>
            
            <!-- Theme Application Options -->
            <div class="theme-apply-options">
                <h4>Apply Options</h4>
                <label class="checkbox-label">
                    <input type="checkbox" id="apply-to-background-details" checked>
                    Apply to page background
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="apply-to-text-details" checked>
                    Apply to text elements
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="apply-to-buttons-details" checked>
                    Apply to buttons
                </label>
            </div>
            
            <!-- Apply Theme Button -->
            <button id="apply-theme-from-details-btn" class="primary-btn" style="display: none; width: 100%; margin-top: 20px;">
                <span class="btn-icon">🎨</span>
                Apply Selected Theme Elements
            </button>
        </div>
    `;
    
         // Add event listener for the apply button
     const applyBtn = document.getElementById('apply-theme-from-details-btn');
     if (applyBtn) {
         applyBtn.addEventListener('click', () => applyThemeFromDetails());
     }
     
     // Add click event listeners for color and font items
     const colorItems = document.querySelectorAll('.theme-details .color-item');
     console.log('Adding click listeners to color items:', colorItems.length);
     colorItems.forEach(item => {
         item.addEventListener('click', () => {
             const index = parseInt(item.dataset.colorIndex);
             console.log('Color item clicked:', index);
             toggleThemeColorSelectionFromDetails(index);
         });
     });
     
     const fontItems = document.querySelectorAll('.theme-details .font-item');
     console.log('Adding click listeners to font items:', fontItems.length);
     fontItems.forEach(item => {
         item.addEventListener('click', () => {
             const index = parseInt(item.dataset.fontIndex);
             console.log('Font item clicked:', index);
             toggleThemeFontSelectionFromDetails(index);
         });
     });
     
     // Update the apply button visibility
     updateApplyButtonVisibility();
}

function deleteTheme(themeIndex) {
    if (confirm('Are you sure you want to delete this theme?')) {
        savedThemes.splice(themeIndex, 1);
        saveToStorage();
        renderSavedData();
        updateStatus('Theme deleted successfully!', 'success');
    }
}

function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all saved themes?')) {
        savedThemes = [];
        
        // Hide application section when clearing themes
        themeApplicationSection.style.display = 'none';
        
        renderExtractedData();
        renderSavedData();
        saveToStorage();
        updateStatus('All themes cleared!', 'success');
    }
}

function showThemeApplicationSelection() {
    if (!currentThemeForApplication) {
        updateStatus('No theme selected to apply!', 'error');
        return;
    }
    
    // Show the theme application section
    themeApplicationSection.style.display = 'block';
    
    // Reset selections
    selectedThemeColors.clear();
    selectedThemeFonts.clear();
    
    // Render theme colors for selection
    renderThemeApplicationColors();
    
    // Render theme fonts for selection
    renderThemeApplicationFonts();
    
    // Update status
    updateThemeApplicationStatus();
}

function renderThemeApplicationColors() {
    if (!currentThemeForApplication.colors || currentThemeForApplication.colors.length === 0) {
        themeApplyColorsGrid.innerHTML = '<div class="empty-state">No colors in this theme</div>';
        return;
    }
    
    themeApplyColorsGrid.innerHTML = currentThemeForApplication.colors.map((color, index) => `
        <div class="color-item ${selectedThemeColors.has(index) ? 'selected' : ''}" data-color-index="${index}">
            <div class="color-preview" style="background-color: ${color.hex}"></div>
            <div class="color-hex">${color.hex}</div>
        </div>
    `).join('');
    
    // Add click events for color selection
    themeApplyColorsGrid.querySelectorAll('.color-item').forEach(item => {
        item.addEventListener('click', () => toggleThemeColorSelection(parseInt(item.dataset.colorIndex)));
    });
}

function renderThemeApplicationFonts() {
    if (!currentThemeForApplication.fonts || currentThemeForApplication.fonts.length === 0) {
        themeApplyFontsList.innerHTML = '<div class="empty-state">No fonts in this theme</div>';
        return;
    }
    
    themeApplyFontsList.innerHTML = currentThemeForApplication.fonts.map((font, index) => `
        <div class="font-item ${selectedThemeFonts.has(index) ? 'selected' : ''}" data-font-index="${index}">
            <div class="font-name">${font.name}</div>
            <div class="font-details">
                <span>Weight: ${font.weight}</span>
                <span class="font-size">${font.size}</span>
                ${font.style && font.style !== 'normal' ? `<span class="font-style">${font.style}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    // Add click events for font selection
    themeApplyFontsList.querySelectorAll('.font-item').forEach(item => {
        item.addEventListener('click', () => toggleThemeFontSelection(parseInt(item.dataset.fontIndex)));
    });
}

function toggleThemeColorSelection(index) {
    if (selectedThemeColors.has(index)) {
        selectedThemeColors.delete(index);
    } else {
        selectedThemeColors.add(index);
    }
    renderThemeApplicationColors();
    updateThemeApplicationStatus();
}

function toggleThemeFontSelection(index) {
    if (selectedThemeFonts.has(index)) {
        selectedThemeFonts.delete(index);
    } else {
        selectedThemeFonts.add(index);
    }
    renderThemeApplicationFonts();
    updateThemeApplicationStatus();
}

// Theme Application Selection Functions
function selectAllThemeColors() {
    if (!currentThemeForApplication || !currentThemeForApplication.colors) return;
    
    selectedThemeColors.clear();
    currentThemeForApplication.colors.forEach((_, index) => selectedThemeColors.add(index));
    renderThemeApplicationColors();
    updateThemeApplicationStatus();
}

function deselectAllThemeColors() {
    selectedThemeColors.clear();
    renderThemeApplicationColors();
    updateThemeApplicationStatus();
}

function selectAllThemeFonts() {
    if (!currentThemeForApplication || !currentThemeForApplication.fonts) return;
    
    selectedThemeFonts.clear();
    currentThemeForApplication.fonts.forEach((_, index) => selectedThemeFonts.add(index));
    renderThemeApplicationFonts();
    updateThemeApplicationStatus();
}

function deselectAllThemeFonts() {
    selectedThemeFonts.clear();
    renderThemeApplicationFonts();
    updateThemeApplicationStatus();
}

function updateThemeApplicationStatus() {
    const colorCount = selectedThemeColors.size;
    const fontCount = selectedThemeFonts.size;
    
    if (colorCount === 0 && fontCount === 0) {
        updateStatus('Select colors and fonts to apply, then click "Apply Selected Elements"', 'info');
    } else {
        updateStatus(`Selected: ${colorCount} colors, ${fontCount} fonts. Click "Apply Selected Elements" to apply.`, 'info');
    }
}

// Theme Details Selection Functions
function toggleThemeColorSelectionFromDetails(index) {
     console.log('Toggling color selection for index:', index);
     if (selectedThemeColors.has(index)) {
         selectedThemeColors.delete(index);
         console.log('Removed color from selection');
     } else {
         selectedThemeColors.add(index);
         console.log('Added color to selection');
     }
     console.log('Selected colors:', Array.from(selectedThemeColors));
     updateThemeDetailsDisplay();
     updateApplyButtonVisibility();
 }

function toggleThemeFontSelectionFromDetails(index) {
     console.log('Toggling font selection for index:', index);
     if (selectedThemeFonts.has(index)) {
         selectedThemeFonts.delete(index);
         console.log('Removed font from selection');
     } else {
         selectedThemeFonts.add(index);
         console.log('Added font to selection');
     }
     console.log('Selected fonts:', Array.from(selectedThemeFonts));
     updateThemeDetailsDisplay();
     updateApplyButtonVisibility();
 }

function selectAllThemeColorsFromDetails() {
    if (!currentThemeForApplication || !currentThemeForApplication.colors) return;
    
    selectedThemeColors.clear();
    currentThemeForApplication.colors.forEach((_, index) => selectedThemeColors.add(index));
    updateThemeDetailsDisplay();
    updateApplyButtonVisibility();
}

function deselectAllThemeColorsFromDetails() {
    selectedThemeColors.clear();
    updateThemeDetailsDisplay();
    updateApplyButtonVisibility();
}

function selectAllThemeFontsFromDetails() {
    if (!currentThemeForApplication || !currentThemeForApplication.fonts) return;
    
    selectedThemeFonts.clear();
    currentThemeForApplication.fonts.forEach((_, index) => selectedThemeFonts.add(index));
    updateThemeDetailsDisplay();
    updateApplyButtonVisibility();
}

function deselectAllThemeFontsFromDetails() {
    selectedThemeFonts.clear();
    updateThemeDetailsDisplay();
    updateApplyButtonVisibility();
}

function updateThemeDetailsDisplay() {
     console.log('Updating theme details display');
     console.log('Selected colors:', Array.from(selectedThemeColors));
     console.log('Selected fonts:', Array.from(selectedThemeFonts));
     
     // Update color items selection display
     const colorItems = document.querySelectorAll('.theme-details .color-item');
     console.log('Found color items:', colorItems.length);
     colorItems.forEach((item, index) => {
         if (selectedThemeColors.has(index)) {
             item.classList.add('selected');
             console.log('Added selected class to color item', index);
         } else {
             item.classList.remove('selected');
             console.log('Removed selected class from color item', index);
         }
     });
     
     // Update font items selection display
     const fontItems = document.querySelectorAll('.theme-details .font-item');
     console.log('Found font items:', fontItems.length);
     fontItems.forEach((item, index) => {
         if (selectedThemeFonts.has(index)) {
             item.classList.add('selected');
             console.log('Added selected class to font item', index);
         } else {
             item.classList.remove('selected');
             console.log('Removed selected class from font item', index);
         }
     });
 }

function updateApplyButtonVisibility() {
    const applyBtn = document.getElementById('apply-theme-from-details-btn');
    if (applyBtn) {
        const hasSelections = selectedThemeColors.size > 0 || selectedThemeFonts.size > 0;
        applyBtn.style.display = hasSelections ? 'block' : 'none';
    }
}

async function applyThemeFromDetails() {
    if (selectedThemeColors.size === 0 && selectedThemeFonts.size === 0) {
        updateStatus('Please select at least one color or font to apply!', 'error');
        return;
    }
    
    try {
        updateStatus('Applying selected theme elements...', 'loading');
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        // Get selected colors and fonts
        const selectedColorsArray = Array.from(selectedThemeColors).map(index => currentThemeForApplication.colors[index]);
        const selectedFontsArray = Array.from(selectedThemeFonts).map(index => currentThemeForApplication.fonts[index]);
        
        // Get application options from the details view
        const applyToBackground = document.getElementById('apply-to-background-details');
        const applyToText = document.getElementById('apply-to-text-details');
        const applyToButtons = document.getElementById('apply-to-buttons-details');
        
        const applicationOptions = {
            applyToBackground: applyToBackground ? applyToBackground.checked : true,
            applyToText: applyToText ? applyToText.checked : true,
            applyToButtons: applyToButtons ? applyToButtons.checked : true
        };
        
        // Execute content script to apply selected elements
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: applySelectedThemeElementsToPage,
            args: [selectedColorsArray, selectedFontsArray, applicationOptions]
        });
        
        updateStatus(`Applied ${selectedColorsArray.length} colors and ${selectedFontsArray.length} fonts successfully!`, 'success');
        
    } catch (error) {
        console.error('Theme application error:', error);
        updateStatus('Failed to apply theme elements. Please try again.', 'error');
    }
}

async function applySelectedThemeElements() {
    if (selectedThemeColors.size === 0 && selectedThemeFonts.size === 0) {
        updateStatus('Please select at least one color or font to apply!', 'error');
        return;
    }
    
    try {
        updateStatus('Applying selected theme elements...', 'loading');
        
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        // Get selected colors and fonts
        const selectedColorsArray = Array.from(selectedThemeColors).map(index => currentThemeForApplication.colors[index]);
        const selectedFontsArray = Array.from(selectedThemeFonts).map(index => currentThemeForApplication.fonts[index]);
        
        // Get application options
        const applicationOptions = {
            applyToBackground: applyToBackground.checked,
            applyToText: applyToText.checked,
            applyToButtons: applyToButtons.checked
        };
        
        // Execute content script to apply selected elements
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: applySelectedThemeElementsToPage,
            args: [selectedColorsArray, selectedFontsArray, applicationOptions]
        });
        
        updateStatus(`Applied ${selectedColorsArray.length} colors and ${selectedFontsArray.length} fonts successfully!`, 'success');
        
        // Hide the application section
        themeApplicationSection.style.display = 'none';
        
    } catch (error) {
        console.error('Theme application error:', error);
        updateStatus('Failed to apply theme elements. Please try again.', 'error');
    }
}

// Utility Functions
function updateStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Auto-clear success messages
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.textContent = 'Ready to extract';
            statusDiv.className = 'status';
        }, 3000);
    }
}

function updateCounts() {
    colorCount.textContent = extractedColors.length;
    fontCount.textContent = extractedFonts.length;
}

// Storage Functions
function saveToStorage() {
    console.log('saveToStorage called, saving themes:', savedThemes);
    chrome.storage.sync.set({
        savedThemes: savedThemes
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving to storage:', chrome.runtime.lastError);
        } else {
            console.log('Successfully saved to storage');
        }
    });
}

function loadSavedData() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['savedThemes'], (result) => {
            console.log('Loading saved data, result:', result);
            savedThemes = result.savedThemes || [];
            console.log('savedThemes after loading:', savedThemes);
            resolve();
        });
    });
}
