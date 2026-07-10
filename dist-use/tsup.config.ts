import { defineConfig } from 'tsup';

/**
 * 打两份 Node 产物：
 * - getDeckNodes.js  → ESM（import）
 * - getDeckNodes.cjs → CJS（require）
 *
 * svg-to-deck-converter 外置：由 package.json exports 自动选
 * dist/node/index.js / index.cjs，不要手写 require 浏览器产物。
 *
 * DTS 用 tsconfig.build.json（含 ignoreDeprecations），避免 IDE 用旧 TS
 * 时对主 tsconfig 报 Invalid value for ignoreDeprecations。
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
    tsconfig: 'tsconfig.build.json',
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
    tsconfig: 'tsconfig.build.json',
  },
]);
