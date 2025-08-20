import React, { useState } from 'react';
import { FiSun, FiMoon, FiGrid, FiLayout } from 'react-icons/fi';

export default function ThemePreview({ colors, baseColor }) {
  const [activeTheme, setActiveTheme] = useState('light');
  const [activeLayout, setActiveLayout] = useState('card');

  if (colors.length === 0) {
    return (
      <div className="theme-preview">
        <h3>Theme Preview</h3>
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Select colors to see theme previews
        </p>
      </div>
    );
  }

  const primaryColor = colors[0] || baseColor;
  const secondaryColor = colors[1] || '#6c757d';
  const accentColor = colors[2] || '#28a745';
  const backgroundColor = colors[3] || '#f8f9fa';
  const textColor = colors[4] || '#1a1a1a';

  const generateThemeVariants = () => {
    return {
      light: {
        background: backgroundColor,
        surface: '#ffffff',
        text: textColor,
        textSecondary: '#6c757d',
        border: '#e9ecef',
        shadow: 'rgba(0, 0, 0, 0.1)'
      },
      dark: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#404040',
        shadow: 'rgba(0, 0, 0, 0.3)'
      }
    };
  };

  const themes = generateThemeVariants();
  const currentTheme = themes[activeTheme];

  const renderCardLayout = () => (
    <div className="ui-preview" style={{ background: currentTheme.surface, borderColor: currentTheme.border }}>
      <div style={{ 
        background: primaryColor, 
        color: '#ffffff', 
        padding: '16px', 
        borderRadius: '8px 8px 0 0',
        margin: '-20px -20px 20px -20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Sample Card</h2>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: currentTheme.text, marginBottom: '8px' }}>Card Title</h3>
        <p style={{ color: currentTheme.textSecondary, margin: 0, lineHeight: '1.5' }}>
          This is a sample card that demonstrates how your color palette looks in a typical UI component.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{
          background: secondaryColor,
          color: '#ffffff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Secondary Action
        </button>
        <button style={{
          background: accentColor,
          color: '#ffffff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Primary Action
        </button>
      </div>
    </div>
  );

  const renderDashboardLayout = () => (
    <div className="ui-preview" style={{ background: currentTheme.surface, borderColor: currentTheme.border }}>
      <div style={{ 
        background: primaryColor, 
        color: '#ffffff', 
        padding: '16px', 
        borderRadius: '8px 8px 0 0',
        margin: '-20px -20px 20px -20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Dashboard Header</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ 
          background: currentTheme.background, 
          padding: '16px', 
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <h4 style={{ color: currentTheme.text, margin: '0 0 8px 0' }}>Metric 1</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>1,234</div>
        </div>
        <div style={{ 
          background: currentTheme.background, 
          padding: '16px', 
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <h4 style={{ color: currentTheme.text, margin: '0 0 8px 0' }}>Metric 2</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: secondaryColor }}>567</div>
        </div>
      </div>
      
      <div style={{ 
        background: currentTheme.background, 
        padding: '16px', 
        borderRadius: '8px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <h4 style={{ color: currentTheme.text, margin: '0 0 12px 0' }}>Recent Activity</h4>
        <div style={{ color: currentTheme.textSecondary, fontSize: '14px' }}>
          <div style={{ padding: '8px 0', borderBottom: `1px solid ${currentTheme.border}` }}>
            User completed task A
          </div>
          <div style={{ padding: '8px 0', borderBottom: `1px solid ${currentTheme.border}` }}>
            New project created
          </div>
          <div style={{ padding: '8px 0' }}>
            System update completed
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormLayout = () => (
    <div className="ui-preview" style={{ background: currentTheme.surface, borderColor: currentTheme.border }}>
      <div style={{ 
        background: primaryColor, 
        color: '#ffffff', 
        padding: '16px', 
        borderRadius: '8px 8px 0 0',
        margin: '-20px -20px 20px -20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Contact Form</h2>
      </div>
      
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            color: currentTheme.text,
            fontWeight: '500'
          }}>
            Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '6px',
              background: currentTheme.background,
              color: currentTheme.text
            }}
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            color: currentTheme.text,
            fontWeight: '500'
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '6px',
              background: currentTheme.background,
              color: currentTheme.text
            }}
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            color: currentTheme.text,
            fontWeight: '500'
          }}>
            Message
          </label>
          <textarea
            placeholder="Enter your message"
            rows="3"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '6px',
              background: currentTheme.background,
              color: currentTheme.text,
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            background: secondaryColor,
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button style={{
            background: accentColor,
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="theme-preview">
      <h3>Theme Preview</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`theme-toggle ${activeTheme === 'light' ? 'active' : ''}`}
            onClick={() => setActiveTheme('light')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activeTheme === 'light' ? '#667eea' : '#ffffff',
              color: activeTheme === 'light' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiSun />
            Light
          </button>
          <button
            className={`theme-toggle ${activeTheme === 'dark' ? 'active' : ''}`}
            onClick={() => setActiveTheme('dark')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activeTheme === 'dark' ? '#667eea' : '#ffffff',
              color: activeTheme === 'dark' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiMoon />
            Dark
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`layout-toggle ${activeLayout === 'card' ? 'active' : ''}`}
            onClick={() => setActiveLayout('card')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activeLayout === 'card' ? '#667eea' : '#ffffff',
              color: activeLayout === 'card' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiGrid />
            Card
          </button>
          <button
            className={`layout-toggle ${activeLayout === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveLayout('dashboard')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activeLayout === 'dashboard' ? '#667eea' : '#ffffff',
              color: activeLayout === 'dashboard' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiLayout />
            Dashboard
          </button>
          <button
            className={`layout-toggle ${activeLayout === 'form' ? 'active' : ''}`}
            onClick={() => setActiveLayout('form')}
            style={{
              padding: '8px 16px',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              background: activeLayout === 'form' ? '#667eea' : '#ffffff',
              color: activeLayout === 'form' ? '#ffffff' : '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FiLayout />
            Form
          </button>
        </div>
      </div>

      <div style={{ background: currentTheme.background, padding: '20px', borderRadius: '8px' }}>
        {activeLayout === 'card' && renderCardLayout()}
        {activeLayout === 'dashboard' && renderDashboardLayout()}
        {activeLayout === 'form' && renderFormLayout()}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
        This preview shows how your colors would look in a {activeTheme} {activeLayout} theme
      </div>
    </div>
  );
}
