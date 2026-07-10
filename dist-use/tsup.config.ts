import { defineConfig } from 'tsup';

/**
 * 打两份 Node 产物：
 * - getDeckNodes.js  → ESM（import）
 * - getDeckNodes.cjs → CJS（require）
 *
 * svg-to-deck-converter 外置：由 package.json exports 自动选
 * index.node.js / index.node.cjs，不要手写 require(index.node.js)。
 */
export default defineConfig([
  {
    entry: { getDeckNodes: 'src/getDeckNodes.ts' },
    format: ['esm'],
    platform: 'node',
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['svg-to-deck-converter'],
  },
  {
    entry: { getDeckNodes: 'src/getDeckNodes.ts' },
    format: ['cjs'],
    platform: 'node',
    outDir: 'dist',
    dts: false,
    sourcemap: true,
    clean: false,
    outExtension: () => ({ js: '.cjs' }),
    external: ['svg-to-deck-converter'],
  },
]);
