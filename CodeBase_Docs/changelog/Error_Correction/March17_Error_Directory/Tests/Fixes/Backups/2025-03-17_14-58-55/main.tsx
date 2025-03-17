import * as React from "react";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloadCommonRoutes, preloadLowPriorityRoutes } from './utils/preload';

// Create the root and render the application
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Preload common routes after initial render
preloadCommonRoutes();

// Preload low-priority routes after the app has been interactive for a while
preloadLowPriorityRoutes();
