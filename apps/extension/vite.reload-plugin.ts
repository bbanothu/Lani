import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

// Chrome extensions can't hot-swap a running background worker or content
// script, so instead of true HMR we drop a version marker after every
// rebuild that background.js polls for -- see public/background.js.
export function reloadMarker(): Plugin {
  return {
    name: 'reload-marker',
    closeBundle() {
      writeFileSync(resolve(__dirname, 'dist/reload.json'), JSON.stringify({ v: Date.now() }));
    },
  };
}
