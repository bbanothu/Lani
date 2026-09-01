import { defineConfig } from 'vite';
import { reloadMarker } from './vite.reload-plugin';

// Separate build for the background service worker: it needs bundling
// (imports lib/llm, lib/storage) and must ship as a single IIFE file.
// Runs alongside the sidepanel/content builds -- publicDir/emptyOutDir are
// both off so the three builds don't stomp on each other's output.
export default defineConfig({
  plugins: [reloadMarker()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/background/index.ts',
      name: 'LaniBackground',
      formats: ['iife'],
      fileName: () => 'background.js',
    },
  },
});
