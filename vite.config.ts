import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: resolve(__dirname, 'dev'),
  publicDir: resolve(__dirname, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      'svg-to-deck-converter': resolve(__dirname, 'src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/antv-proxy': {
        target: 'https://infographic.antv.vision',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/antv-proxy/, ''),
      },
    },
  },
});
