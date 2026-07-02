import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // 允许读取上级 dist 目录
      allow: [resolve(__dirname, '..')],
    },
    proxy: {
      '/antv-proxy': {
        target: 'https://infographic.antv.vision',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/antv-proxy/, ''),
      },
    },
  },
});
