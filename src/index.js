import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sileo';

// Utilizando la API moderna de React 18 para renderizado
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
      }}
    />
  </BrowserRouter>
);