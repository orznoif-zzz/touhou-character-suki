import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  base: './', plugins: [react(), tailwindcss()],
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('node_modules')) return 'vendor';
    if (id.endsWith('/data/characters.json')) return 'characters';
  } } } },
});
