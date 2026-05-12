import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './renderer/App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('EcoHub SAF Client root element was not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
