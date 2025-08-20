
import React, { useEffect, useState } from 'react';
import './Options.css';
import { loadPalettes, deletePalette } from '../utils/storage';

export default function Options() {
  const [palettes, setPalettes] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadPalettes().then(setPalettes);
  }, []);

  const handleDelete = async (id) => {
    await deletePalette(id);
    setPalettes(await loadPalettes());
  };

  // Group palettes by folder/tag
  const grouped = {};
  palettes.forEach(p => {
    const folder = p.folder || 'Uncategorized';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(p);
  });

  return (
    <div className="options-root">
      <h2>Palette Organization</h2>
      <input
        type="text"
        placeholder="Filter by tag or name..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{marginBottom: 12, width: '100%'}}
      />
      {Object.keys(grouped).map(folder => (
        <div key={folder} className="palette-folder">
          <h3>{folder}</h3>
          <ul>
            {grouped[folder]
              .filter(p =>
                (!filter ||
                  (p.name && p.name.toLowerCase().includes(filter.toLowerCase())) ||
                  (p.tags && p.tags.join(',').toLowerCase().includes(filter.toLowerCase()))
                )
              )
              .map(p => (
                <li key={p.id} className="palette-item">
                  <span className="palette-name">{p.name || p.id}</span>
                  <span className="palette-tags">{p.tags ? p.tags.join(', ') : ''}</span>
                  <div className="palette-swatch-list">
                    {p.palette.map((color, i) => (
                      <span key={i} className="palette-swatch" style={{background: color}} title={color} />
                    ))}
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="delete-btn">Delete</button>
                </li>
              ))}
          </ul>
        </div>
      ))}
      {palettes.length === 0 && <div>No palettes saved yet.</div>}
    </div>
  );
}
