// Background script for Figma Palette & Color Picker Extension

// Initialize context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pickColor',
    title: 'Pick Color',
    contexts: ['all']
  });
  
  chrome.contextMenus.create({
    id: 'snapArea',
    title: 'Snap Area for Palette',
    contexts: ['all']
  });
  
  chrome.contextMenus.create({
    id: 'inspectFonts',
    title: 'Inspect Fonts',
    contexts: ['all']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pickColor') {
    chrome.tabs.sendMessage(tab.id, { action: 'startColorPicker' });
  } else if (info.menuItemId === 'snapArea') {
    chrome.tabs.sendMessage(tab.id, { action: 'startAreaSnap' });
  } else if (info.menuItemId === 'inspectFonts') {
    chrome.tabs.sendMessage(tab.id, { action: 'inspectFonts' });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startColorPicker') {
    // Start color picker on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startColorPicker' });
      }
    });
    sendResponse({ success: true });
  }
  
  if (request.action === 'startAreaSnap') {
    // Start area snap on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startAreaSnap' });
      }
    });
    sendResponse({ success: true });
  }
  
  if (request.action === 'inspectFonts') {
    // Start font inspection on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'inspectFonts' });
      }
    });
    sendResponse({ success: true });
  }
  
  if (request.action === 'getColorFromPage') {
    // Get color from specific coordinates
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getColorAtPosition',
        x: request.x,
        y: request.y
      }, sendResponse);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'snapArea') {
    // Handle area snapping
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'snapArea',
        coordinates: request.coordinates
      }, sendResponse);
    });
    return true;
  }
  
  if (request.action === 'getPageFonts') {
    // Get fonts from current page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getPageFonts'
      }, sendResponse);
    });
    return true;
  }
  
  if (request.action === 'savePalette') {
    // Save palette to storage
    chrome.storage.local.get(['palettes'], (result) => {
      const palettes = result.palettes || [];
      const newPalette = {
        id: Date.now().toString(),
        name: request.name,
        colors: request.colors,
        timestamp: new Date().toISOString(),
        url: request.url
      };
      palettes.push(newPalette);
      chrome.storage.local.set({ palettes }, () => {
        sendResponse({ success: true, palette: newPalette });
      });
    });
    return true;
  }
  
  if (request.action === 'getPalettes') {
    // Get saved palettes
    chrome.storage.local.get(['palettes'], (result) => {
      sendResponse({ palettes: result.palettes || [] });
    });
    return true;
  }
  
  if (request.action === 'deletePalette') {
    // Delete palette
    chrome.storage.local.get(['palettes'], (result) => {
      const palettes = result.palettes || [];
      const filteredPalettes = palettes.filter(p => p.id !== request.id);
      chrome.storage.local.set({ palettes: filteredPalettes }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'copyToClipboard') {
    // Copy text to clipboard
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'copyToClipboard',
        text: request.text
      }, sendResponse);
    });
    return true;
  }
  
  if (request.action === 'updateContextMenus') {
    // Update context menus based on settings
    chrome.storage.sync.get(['enableContextMenu'], (result) => {
      if (result.enableContextMenu === false) {
        chrome.contextMenus.removeAll();
      } else {
        // Recreate context menus if they were removed
        chrome.contextMenus.removeAll(() => {
          chrome.contextMenus.create({
            id: 'pickColor',
            title: 'Pick Color',
            contexts: ['all']
          });
          
          chrome.contextMenus.create({
            id: 'snapArea',
            title: 'Snap Area for Palette',
            contexts: ['all']
          });
          
          chrome.contextMenus.create({
            id: 'inspectFonts',
            title: 'Inspect Fonts',
            contexts: ['all']
          });
        });
      }
    });
    sendResponse({ success: true });
  }
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Content script is already injected via manifest, no need to inject manually
    console.log('Tab updated:', tab.url);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to manifest configuration
  console.log('Extension icon clicked');
});

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default options
    chrome.storage.sync.set({
      defaultColorFormat: 'hex',
      autoCopy: false,
      maxColors: 20,
      defaultPaletteType: 'complementary',
      popupWidth: 400,
      theme: 'light',
      enableContextMenu: true,
      enableKeyboardShortcuts: false,
      syncAcrossDevices: true
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});