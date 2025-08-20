import React from 'react';

export default function PaletteEditor({ palette, onReorder, onDelete, onAdd }) {
  return (
    <div className="palette-editor">
      {/* Add UI for reordering, deleting, and adding colors */}
      {palette.map((color, i) => (
        <div key={i} className="palette-edit-color" style={{ background: color }}>
          <button onClick={() => onDelete(i)}>Delete</button>
        </div>
      ))}
      <button onClick={onAdd}>Add Color</button>
    </div>
  );
}
