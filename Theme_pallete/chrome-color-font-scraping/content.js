// Content script for Color & Font Scraper extension
// This script is injected into web pages and can provide additional functionality

console.log('Color & Font Scraper content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
    }
});
