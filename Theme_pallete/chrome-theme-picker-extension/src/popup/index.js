import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import Popup from './Popup';

// Create root and render the popup
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Popup />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#4ade80',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#fff',
          },
        },
      }}
    />
  </React.StrictMode>
);
