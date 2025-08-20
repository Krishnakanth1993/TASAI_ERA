// Chrome storage and sync helpers

// Save a palette (with optional folder/tag info)
export function savePalette(palette, meta = {}) {
  // palette: array of colors, meta: {name, folder, tags, created}
  const id = meta.id || 'palette_' + Date.now();
  const data = { ...meta, id, palette };
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['palettes'], res => {
      const palettes = res.palettes || [];
      const idx = palettes.findIndex(p => p.id === id);
      if (idx >= 0) palettes[idx] = data;
      else palettes.push(data);
      chrome.storage.sync.set({ palettes }, () => resolve(id));
    });
  });
}

// Load all palettes
export function loadPalettes() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['palettes'], res => {
      resolve(res.palettes || []);
    });
  });
}

// Delete a palette by id
export function deletePalette(id) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['palettes'], res => {
      let palettes = res.palettes || [];
      palettes = palettes.filter(p => p.id !== id);
      chrome.storage.sync.set({ palettes }, () => resolve());
    });
  });
}
