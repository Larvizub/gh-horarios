import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sileo';

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
    <Toaster
      position="top-right"
      offset={{ top: 80, right: 16 }}
      options={{
        duration: 4000,
        roundness: 16,
        fill: '#0f172a',
        styles: {
          title: 'sileo-title',
          description: 'sileo-description',
          badge: 'sileo-badge-hidden',
        },
      }}
    />
  </BrowserRouter>
);
