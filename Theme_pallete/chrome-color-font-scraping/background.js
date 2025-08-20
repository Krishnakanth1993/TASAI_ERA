// Background service worker for Color & Font Scraper extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Color & Font Scraper extension installed');
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
    }
});
