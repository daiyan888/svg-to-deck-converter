import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const peerDependencies = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@tiptap/core',
  '@tiptap/react',
  '@tiptap/extension-paragraph',
  '@tiptap/extension-text',
  '@tiptap/pm',
];

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'SvgToDeck',
      fileName: () => 'svg-to-deck.js',
      formats: ['es'],
    },
    outDir: 'lib',
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => peerDependencies.includes(id) || id.startsWith('@tiptap/'),
    },
  },
});
