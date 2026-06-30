import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/antv-proxy': {
        target: 'https://infographic.antv.vision',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/antv-proxy/, ''),
      },
    },
  },
})
