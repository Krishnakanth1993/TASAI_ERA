document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.getElementById('color-input');
    const colorDisplay = document.getElementById('color-display');
    const applyButton = document.getElementById('apply-button');

    colorInput.addEventListener('input', function() {
        colorDisplay.style.backgroundColor = colorInput.value;
    });

    applyButton.addEventListener('click', function() {
        const selectedColor = colorInput.value;
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { color: selectedColor });
        });
    });
});