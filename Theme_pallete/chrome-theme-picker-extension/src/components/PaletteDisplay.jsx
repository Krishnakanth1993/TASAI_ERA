import React, { useState } from 'react';
import { FiSave, FiEdit3, FiTrash2, FiCopy } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function PaletteDisplay({ colors, onSavePalette }) {
  const [isEditing, setIsEditing] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editableColors, setEditableColors] = useState([...colors]);

  const handleSavePalette = () => {
    if (!paletteName.trim()) {
      toast.error('Please enter a palette name');
      return;
    }
    
    onSavePalette(paletteName, editableColors);
    setPaletteName('');
    setShowSaveForm(false);
    setIsEditing(false);
    setEditableColors([...colors]);
  };

  const handleColorDelete = (index) => {
    const newColors = editableColors.filter((_, i) => i !== index);
    setEditableColors(newColors);
  };

  const handleColorReorder = (fromIndex, toIndex) => {
    const newColors = [...editableColors];
    const [movedColor] = newColors.splice(fromIndex, 1);
    newColors.splice(toIndex, 0, movedColor);
    setEditableColors(newColors);
  };

  const copyPaletteToClipboard = async () => {
    const paletteText = editableColors.join('\n');
    try {
      await navigator.clipboard.writeText(paletteText);
      toast.success('Palette copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy palette');
    }
  };

  const copyColorToClipboard = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      toast.success(`${color} copied!`);
    } catch (error) {
      toast.error('Failed to copy color');
    }
  };

  if (colors.length === 0) {
    return (
      <div className="palette-display">
        <h3>Current Palette</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No colors in palette yet. Pick some colors to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="palette-display">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Current Palette ({editableColors.length} colors)</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isEditing && (
            <>
              <button
                className="action-btn secondary"
                onClick={() => setIsEditing(true)}
                title="Edit palette"
              >
                <FiEdit3 />
                Edit
              </button>
              <button
                className="action-btn secondary"
                onClick={copyPaletteToClipboard}
                title="Copy all colors"
              >
                <FiCopy />
                Copy All
              </button>
            </>
          )}
          <button
            className="action-btn primary"
            onClick={() => setShowSaveForm(true)}
            title="Save palette"
          >
            <FiSave />
            Save
          </button>
        </div>
      </div>

      <div className="palette-grid">
        {editableColors.map((color, index) => (
          <div
            key={`${color}-${index}`}
            className="palette-color"
            style={{ backgroundColor: color }}
            title={color}
          >
            {isEditing && (
              <div className="color-actions">
                <button
                  className="action-btn small danger"
                  onClick={() => handleColorDelete(index)}
                  title="Delete color"
                  style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px 4px' }}
                >
                  <FiTrash2 />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="action-btn secondary"
            onClick={() => {
              setIsEditing(false);
              setEditableColors([...colors]);
            }}
            style={{ marginRight: '8px' }}
          >
            Cancel
          </button>
          <button
            className="action-btn primary"
            onClick={() => {
              setIsEditing(false);
              // Colors are already updated in state
            }}
          >
            Done
          </button>
        </div>
      )}

      {showSaveForm && (
        <div className="save-palette-form" style={{ marginTop: '20px' }}>
          <h4>Save Palette</h4>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Enter palette name"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '6px' }}
            />
            <button
              className="action-btn primary"
              onClick={handleSavePalette}
            >
              Save
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setShowSaveForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
