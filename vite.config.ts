import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'web/game',
  server: {
    port: 3000,
    open: false,
    hmr: true,
  },
  build: {
    outDir: '../../dist-bundle',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});