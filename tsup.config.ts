import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Options } from 'tsup';

const distDir = resolve(__dirname, 'dist');

const shared: Options = {
  tsconfig: 'tsconfig.lib.json',
  sourcemap: true,
  splitting: false,
  treeshake: true,
  noExternal: [/@antv\/infographic/],
  outDir: 'dist',
};

const cjsOutExtension: NonNullable<Options['outExtension']> = () => ({ js: '.cjs' });

const browserAlias = {
  '@antv/infographic/ssr': resolve(__dirname, 'src/stubs/infographic-ssr.ts'),
  'svg-to-deck-local-fonts': resolve(__dirname, 'src/stubs/local-fonts.ts'),
};

const nodeAlias = {
  'svg-to-deck-local-fonts': resolve(__dirname, 'src/gallery/local-fonts.ts'),
};

const nodeNoExternal = [
  /@antv\/infographic/,
  'measury',
  /^measury\//,
  'linkedom',
  'postcss',
] as const;

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    platform: 'browser',
    clean: true,
    dts: true,
    esbuildOptions(options) {
      options.alias = browserAlias;
    },
    async onSuccess() {
      rmSync(resolve(distDir, 'converter'), { recursive: true, force: true });
      rmSync(resolve(distDir, 'gallery'), { recursive: true, force: true });
      rmSync(resolve(distDir, 'types'), { recursive: true, force: true });
      rmSync(resolve(distDir, 'stubs'), { recursive: true, force: true });
    },
  },
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['cjs'],
    platform: 'browser',
    clean: false,
    dts: false,
    outExtension: cjsOutExtension,
    esbuildOptions(options) {
      options.alias = browserAlias;
    },
  },
  {
    ...shared,
    entry: { 'index.node': 'src/index.ts' },
    format: ['esm'],
    platform: 'node',
    clean: false,
    dts: false,
    // Bundle SSR runtime deps so copying only dist/ works without installing
    // measury / linkedom / postcss in the consumer project.
    noExternal: [...nodeNoExternal],
    // postcss 等 CJS 依赖会 require('path')；ESM 产物需注入 createRequire
    banner: {
      js: "import { createRequire as __svgToDeckCreateRequire } from 'node:module'; const require = __svgToDeckCreateRequire(import.meta.url);",
    },
    esbuildOptions(options) {
      options.alias = nodeAlias;
    },
  },
  {
    ...shared,
    entry: { 'index.node': 'src/index.ts' },
    format: ['cjs'],
    platform: 'node',
    clean: false,
    dts: false,
    outExtension: cjsOutExtension,
    noExternal: [...nodeNoExternal],
    esbuildOptions(options) {
      options.alias = nodeAlias;
    },
  },
]);
