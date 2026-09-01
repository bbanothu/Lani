import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reloadMarker } from './vite.reload-plugin';

export default defineConfig({
  plugins: [react(), reloadMarker()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { sidepanel: 'sidepanel.html' },
    },
  },
});
