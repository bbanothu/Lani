import { defineConfig } from 'vite';
import { reloadMarker } from './vite.reload-plugin';

// Separate build for the auto-detect content script: it needs bundling
// (imports lib/llm, lib/storage) and must ship as a single IIFE file, since
// Chrome content scripts don't run as ES modules by default. Runs alongside
// the main sidepanel build, not instead of it -- publicDir/emptyOutDir are
// both off so the two builds don't stomp on each other's output.
export default defineConfig({
  plugins: [reloadMarker()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/content/detect.ts',
      name: 'LaniDetect',
      formats: ['iife'],
      fileName: () => 'detect.js',
    },
  },
});
