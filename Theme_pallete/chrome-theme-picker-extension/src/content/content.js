// Content script for Figma Palette & Color Picker Extension

let isColorPickerActive = false;
let isAreaSnapActive = false;
let colorPickerOverlay = null;
let areaSnapOverlay = null;
let selectedColors = [];

// Initialize content script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Figma Palette & Color Picker content script loaded');
  setupMessageListener();
});

// Listen for messages from background script
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startColorPicker') {
      startColorPicker();
      sendResponse({ success: true });
    } else if (request.action === 'startAreaSnap') {
      startAreaSnap();
      sendResponse({ success: true });
    } else if (request.action === 'getColorAtPosition') {
      const color = getColorAtPosition(request.x, request.y);
      sendResponse({ color });
    } else if (request.action === 'snapArea') {
      const colors = snapArea(request.coordinates);
      sendResponse({ colors });
    } else if (request.action === 'getPageFonts') {
      const fonts = getPageFonts();
      sendResponse({ fonts });
    } else if (request.action === 'inspectFonts') {
      inspectFonts();
      sendResponse({ success: true });
    } else if (request.action === 'copyToClipboard') {
      copyToClipboard(request.text);
      sendResponse({ success: true });
    }
  });
}

// Color Picker functionality
function startColorPicker() {
  if (isColorPickerActive) return;
  
  isColorPickerActive = true;
  document.body.style.cursor = 'crosshair';
  
  // Create overlay for color picking
  colorPickerOverlay = document.createElement('div');
  colorPickerOverlay.id = 'color-picker-overlay';
  colorPickerOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999;
    cursor: crosshair;
    background: transparent;
  `;
  
  document.body.appendChild(colorPickerOverlay);
  
  // Add event listeners
  colorPickerOverlay.addEventListener('click', handleColorPick);
  colorPickerOverlay.addEventListener('mousemove', handleColorPreview);
  colorPickerOverlay.addEventListener('keydown', handleEscapeKey);
  
  // Focus overlay to capture keyboard events
  colorPickerOverlay.focus();
  
  // Show instructions
  showInstructions('Click anywhere to pick a color. Press ESC to cancel.');
}

function handleColorPick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const color = getColorAtPosition(event.clientX, event.clientY);
  if (color) {
    // Send color to popup
    chrome.runtime.sendMessage({
      action: 'colorPicked',
      color: color,
      x: event.clientX,
      y: event.clientY
    });
    
    // Add to selected colors
    selectedColors.push({
      color: color,
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    });
    
    // Show color preview
    showColorPreview(color, event.clientX, event.clientY);
  }
  
  stopColorPicker();
}

function handleColorPreview(event) {
  const color = getColorAtPosition(event.clientX, event.clientY);
  if (color) {
    showColorPreview(color, event.clientX, event.clientY);
  }
}

function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    stopColorPicker();
  }
}

function stopColorPicker() {
  if (!isColorPickerActive) return;
  
  isColorPickerActive = false;
  document.body.style.cursor = '';
  
  if (colorPickerOverlay) {
    colorPickerOverlay.remove();
    colorPickerOverlay = null;
  }
  
  hideInstructions();
}

// Area Snap functionality
function startAreaSnap() {
  if (isAreaSnapActive) return;
  
  isAreaSnapActive = true;
  document.body.style.cursor = 'crosshair';
  
  // Create overlay for area selection
  areaSnapOverlay = document.createElement('div');
  areaSnapOverlay.id = 'area-snap-overlay';
  areaSnapOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999;
    cursor: crosshair;
    background: transparent;
  `;
  
  document.body.appendChild(areaSnapOverlay);
  
  let startX, startY, selectionBox;
  
  areaSnapOverlay.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    
    selectionBox = document.createElement('div');
    selectionBox.style.cssText = `
      position: fixed;
      border: 2px dashed #007bff;
      background: rgba(0, 123, 255, 0.1);
      z-index: 1000000;
      pointer-events: none;
    `;
    document.body.appendChild(selectionBox);
  });
  
  areaSnapOverlay.addEventListener('mousemove', (e) => {
    if (selectionBox && startX !== undefined) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      
      selectionBox.style.left = Math.min(startX, e.clientX) + 'px';
      selectionBox.style.top = Math.min(startY, e.clientY) + 'px';
      selectionBox.style.width = Math.abs(width) + 'px';
      selectionBox.style.height = Math.abs(height) + 'px';
    }
  });
  
  areaSnapOverlay.addEventListener('mouseup', (e) => {
    if (selectionBox && startX !== undefined) {
      const endX = e.clientX;
      const endY = e.clientY;
      
      const coordinates = {
        x1: Math.min(startX, endX),
        y1: Math.min(startY, endY),
        x2: Math.max(startX, endX),
        y2: Math.max(startY, endY)
      };
      
      const colors = snapArea(coordinates);
      
      // Send colors to popup
      chrome.runtime.sendMessage({
        action: 'areaSnapped',
        colors: colors,
        coordinates: coordinates
      });
      
      // Clean up
      selectionBox.remove();
      selectionBox = null;
      startX = startY = undefined;
      
      stopAreaSnap();
    }
  });
  
  areaSnapOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopAreaSnap();
    }
  });
  
  areaSnapOverlay.focus();
  showInstructions('Click and drag to select an area. Press ESC to cancel.');
}

function stopAreaSnap() {
  if (!isAreaSnapActive) return;
  
  isAreaSnapActive = false;
  document.body.style.cursor = '';
  
  if (areaSnapOverlay) {
    areaSnapOverlay.remove();
    areaSnapOverlay = null;
  }
  
  if (selectionBox) {
    selectionBox.remove();
    selectionBox = null;
  }
  
  hideInstructions();
}

// Utility functions
function getColorAtPosition(x, y) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Use html2canvas to capture the page
  html2canvas(document.body, {
    x: x,
    y: y,
    width: 1,
    height: 1,
    useCORS: true,
    allowTaint: true
  }).then(canvas => {
    const imageData = context.getImageData(0, 0, 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }).catch(() => {
    // Fallback: try to get color from element
    const element = document.elementFromPoint(x, y);
    if (element) {
      const style = window.getComputedStyle(element);
      return style.backgroundColor || style.color;
    }
  });
  
  return null;
}

function snapArea(coordinates) {
  const colors = [];
  const step = 10; // Sample every 10px
  
  for (let x = coordinates.x1; x <= coordinates.x2; x += step) {
    for (let y = coordinates.y1; y <= coordinates.y2; y += step) {
      const color = getColorAtPosition(x, y);
      if (color && !colors.includes(color)) {
        colors.push(color);
      }
    }
  }
  
  return colors.slice(0, 20); // Limit to 20 colors
}

function getPageFonts() {
  const fonts = new Set();
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element => {
    const style = window.getComputedStyle(element);
    const fontFamily = style.fontFamily;
    if (fontFamily && fontFamily !== 'inherit') {
      fonts.add(fontFamily);
    }
  });
  
  return Array.from(fonts).map(font => ({
    name: font,
    weight: 'normal',
    style: 'normal',
    url: getGoogleFontsUrl(font)
  }));
}

function getGoogleFontsUrl(fontName) {
  // Convert font name to Google Fonts URL format
  const cleanName = fontName.replace(/['"]/g, '').replace(/\s+/g, '+');
  return `https://fonts.google.com/specimen/${cleanName}`;
}

function inspectFonts() {
  const fonts = getPageFonts();
  chrome.runtime.sendMessage({
    action: 'fontsInspected',
    fonts: fonts
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard:', text);
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
}

// UI helpers
function showInstructions(message) {
  let instructions = document.getElementById('extension-instructions');
  if (!instructions) {
    instructions = document.createElement('div');
    instructions.id = 'extension-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000001;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    document.body.appendChild(instructions);
  }
  
  instructions.textContent = message;
  instructions.style.display = 'block';
}

function hideInstructions() {
  const instructions = document.getElementById('extension-instructions');
  if (instructions) {
    instructions.style.display = 'none';
  }
}

function showColorPreview(color, x, y) {
  let preview = document.getElementById('color-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.id = 'color-preview';
    preview.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 10px;
      z-index: 1000002;
      font-family: Arial, sans-serif;
      font-size: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(preview);
  }
  
  preview.innerHTML = `
    <div style="width: 20px; height: 20px; background: ${color}; border: 1px solid #ccc; margin-bottom: 5px;"></div>
    <div>${color}</div>
  `;
  
  preview.style.left = (x + 10) + 'px';
  preview.style.top = (y - 30) + 'px';
  preview.style.display = 'block';
  
  // Hide preview after 2 seconds
  setTimeout(() => {
    preview.style.display = 'none';
  }, 2000);
}