import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as process from 'process';

(window as any).global = window;
(window as any).process = process;
(window as any).Buffer = [];

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);