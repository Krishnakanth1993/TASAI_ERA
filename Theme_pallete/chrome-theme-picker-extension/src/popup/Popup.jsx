import React, { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { FiDroplet, FiImage, FiType, FiPalette, FiSettings, FiCopy, FiDownload, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ColorPicker from '../components/ColorPicker';
import PaletteDisplay from '../components/PaletteDisplay';
import PaletteGenerator from '../components/PaletteGenerator';
import FontInventory from '../components/FontInventory';
import ThemePreview from '../components/ThemePreview';
import AccessibilityAudit from '../components/AccessibilityAudit';
import ColorHistory from '../components/ColorHistory';
import ExportPanel from '../components/ExportPanel';
import PaletteShare from '../components/PaletteShare';
import './popup.css';

export default function Popup() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentColor, setCurrentColor] = useState('#007bff');
  const [selectedColors, setSelectedColors] = useState([]);
  const [palettes, setPalettes] = useState([]);
  const [fonts, setFonts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedData();
    setupMessageListener();
  }, []);

  const loadSavedData = async () => {
    try {
      const result = await chrome.storage.local.get(['palettes', 'selectedColors']);
      if (result.palettes) setPalettes(result.palettes);
      if (result.selectedColors) setSelectedColors(result.selectedColors);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const setupMessageListener = () => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'colorPicked') {
        setCurrentColor(request.color);
        addToSelectedColors(request.color);
        toast.success(`Color picked: ${request.color}`);
      } else if (request.action === 'areaSnapped') {
        setSelectedColors(request.colors.map(color => ({ color, timestamp: Date.now() })));
        toast.success(`Area snapped! Found ${request.colors.length} colors`);
      } else if (request.action === 'fontsInspected') {
        setFonts(request.fonts);
        toast.success(`Found ${request.fonts.length} fonts`);
      }
    });
  };

  const addToSelectedColors = (color) => {
    const newColor = { color, timestamp: Date.now() };
    setSelectedColors(prev => [newColor, ...prev.slice(0, 19)]); // Keep last 20 colors
  };

  const startColorPicker = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startColorPicker' });
      window.close(); // Close popup to allow color picking
    });
  };

  const startAreaSnap = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startAreaSnap' });
      window.close(); // Close popup to allow area selection
    });
  };

  const inspectPageFonts = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'inspectFonts' });
      window.close();
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const savePalette = async (name, colors) => {
    try {
      const newPalette = {
        id: Date.now().toString(),
        name,
        colors: colors.map(c => typeof c === 'string' ? c : c.color),
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      const updatedPalettes = [...palettes, newPalette];
      await chrome.storage.local.set({ palettes: updatedPalettes });
      setPalettes(updatedPalettes);
      toast.success('Palette saved successfully!');
    } catch (error) {
      console.error('Error saving palette:', error);
      toast.error('Failed to save palette');
    }
  };

  const deletePalette = async (id) => {
    try {
      const updatedPalettes = palettes.filter(p => p.id !== id);
      await chrome.storage.local.set({ palettes: updatedPalettes });
      setPalettes(updatedPalettes);
      toast.success('Palette deleted!');
    } catch (error) {
      console.error('Error deleting palette:', error);
      toast.error('Failed to delete palette');
    }
  };

  return (
    <div className="popup-root">
      <div className="popup-header">
        <div className="header-title">
          <FiPalette className="header-icon" />
          <h1>Figma Palette</h1>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn primary"
            onClick={startColorPicker}
            title="Pick Color from Page"
          >
            <FiDroplet />
            Pick Color
          </button>
          <button 
            className="action-btn secondary"
            onClick={startAreaSnap}
            title="Snap Area for Palette"
          >
            <FiImage />
            Snap Area
          </button>
        </div>
      </div>

      <Tabs selectedIndex={activeTab} onSelect={setActiveTab} className="popup-tabs">
        <TabList className="tab-list">
          <Tab className="tab">
            <FiDroplet />
            <span>Colors</span>
          </Tab>
          <Tab className="tab">
            <FiPalette />
            <span>Palettes</span>
          </Tab>
          <Tab className="tab">
            <FiType />
            <span>Fonts</span>
          </Tab>
          <Tab className="tab">
            <FiImage />
            <span>Themes</span>
          </Tab>
          <Tab className="tab">
            <FiSettings />
            <span>Tools</span>
          </Tab>
        </TabList>

        <TabPanel className="tab-panel">
          <div className="panel-content">
            <ColorPicker 
              currentColor={currentColor}
              onColorChange={setCurrentColor}
              onColorPick={addToSelectedColors}
            />
            <ColorHistory 
              colors={selectedColors}
              onColorSelect={setCurrentColor}
              onCopyColor={copyToClipboard}
            />
          </div>
        </TabPanel>

        <TabPanel className="tab-panel">
          <div className="panel-content">
            <PaletteDisplay 
              colors={selectedColors.map(c => typeof c === 'string' ? c : c.color)}
              onSavePalette={savePalette}
            />
            <PaletteGenerator 
              baseColor={currentColor}
              onPaletteGenerated={setSelectedColors}
            />
            <div className="saved-palettes">
              <h3>Saved Palettes</h3>
              {palettes.map(palette => (
                <div key={palette.id} className="saved-palette">
                  <div className="palette-info">
                    <h4>{palette.name}</h4>
                    <span className="palette-date">
                      {new Date(palette.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="palette-colors">
                    {palette.colors.slice(0, 5).map((color, index) => (
                      <div 
                        key={index}
                        className="palette-color"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {palette.colors.length > 5 && (
                      <span className="more-colors">+{palette.colors.length - 5}</span>
                    )}
                  </div>
                  <div className="palette-actions">
                    <button 
                      className="action-btn small"
                      onClick={() => setSelectedColors(palette.colors.map(c => ({ color: c, timestamp: Date.now() })))}
                    >
                      Load
                    </button>
                    <button 
                      className="action-btn small danger"
                      onClick={() => deletePalette(palette.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabPanel>

        <TabPanel className="tab-panel">
          <div className="panel-content">
            <div className="font-inspector">
              <button 
                className="action-btn primary full-width"
                onClick={inspectPageFonts}
              >
                <FiType />
                Inspect Page Fonts
              </button>
              {fonts.length > 0 && (
                <FontInventory 
                  fonts={fonts}
                  onCopyFont={copyToClipboard}
                />
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel className="tab-panel">
          <div className="panel-content">
            <ThemePreview 
              colors={selectedColors.map(c => typeof c === 'string' ? c : c.color)}
              baseColor={currentColor}
            />
          </div>
        </TabPanel>

        <TabPanel className="tab-panel">
          <div className="panel-content">
            <AccessibilityAudit 
              colors={selectedColors.map(c => typeof c === 'string' ? c : c.color)}
            />
            <ExportPanel 
              colors={selectedColors.map(c => typeof c === 'string' ? c : c.color)}
              palettes={palettes}
            />
            <PaletteShare 
              colors={selectedColors.map(c => typeof c === 'string' ? c : c.color)}
            />
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
