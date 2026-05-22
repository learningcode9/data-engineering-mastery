import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Copies sql.js browser bundle + WASM to /public so they can be served as
// plain scripts — bypasses Vite/Rolldown's ESM bundling of Emscripten code.
function copySqlAssets() {
  function doCopy() {
    const dist = resolve('node_modules/sql.js/dist');
    const pub  = resolve('public');
    for (const name of ['sql-wasm.wasm', 'sql-wasm-browser.js']) {
      const src  = `${dist}/${name}`;
      const dest = `${pub}/${name}`;
      if (existsSync(src)) copyFileSync(src, dest);
    }
  }
  return {
    name: 'copy-sql-assets',
    buildStart:      doCopy,  // runs during `vite build`
    configureServer: doCopy,  // runs when `vite dev` server starts
  };
}

export default defineConfig({
  plugins: [react(), copySqlAssets()],
});
