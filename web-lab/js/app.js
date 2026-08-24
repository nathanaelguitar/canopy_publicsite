/**
 * CanopyChat Web Lab Entry Point
 */

import { AppState } from './state.js?v=20260823i';
import { CanopyApiClient } from './api.js?v=20260823i';
import { OakCanvasRenderer } from './oakCanvas.js?v=20260823i';
import { CanopyUI } from './ui.js?v=20260823i';
import { BrowserLocalCanopyLite } from './browserLocal.js?v=20260823i';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize procedural oak background
  const canvasEl = document.getElementById('oak-canvas');
  const oakRenderer = new OakCanvasRenderer(canvasEl);

  // 2. Initialize application state
  const state = new AppState();
  oakRenderer.setTheme(state.theme);

  // 3. Initialize API client
  const api = new CanopyApiClient(state.backendUrl);
  api.setMockMode(state.mockMode);

  const browserLocal = new BrowserLocalCanopyLite();

  // 4. Initialize UI manager
  const ui = new CanopyUI(state, api, browserLocal);

  // 5. Connect theme updates to canvas
  state.on('themeChange', theme => {
    oakRenderer.setTheme(theme);
  });

  console.log('🌲 CanopyChat Local Web Lab initialized.');
});
