import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'tsup';

const distDir = resolve(__dirname, 'dist');

const shared = {
  tsconfig: 'tsconfig.lib.json',
  sourcemap: true,
  splitting: false,
  treeshake: true,
  noExternal: [/@antv\/infographic/],
  outDir: 'dist',
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    platform: 'browser',
    clean: true,
    dts: true,
    esbuildOptions(options) {
      options.alias = {
        '@antv/infographic/ssr': resolve(__dirname, 'src/stubs/infographic-ssr.ts'),
        'svg-to-deck-local-fonts': resolve(__dirname, 'src/stubs/local-fonts.ts'),
      };
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
    entry: { 'index.node': 'src/index.ts' },
    format: ['esm'],
    platform: 'node',
    clean: false,
    dts: false,
    // Bundle SSR runtime deps so copying only dist/ works without installing
    // measury / linkedom / postcss in the consumer project.
    noExternal: [/@antv\/infographic/, 'measury', /^measury\//, 'linkedom', 'postcss'],
    // postcss 等 CJS 依赖会 require('path')；ESM 产物需注入 createRequire
    banner: {
      js: "import { createRequire as __svgToDeckCreateRequire } from 'node:module'; const require = __svgToDeckCreateRequire(import.meta.url);",
    },
    esbuildOptions(options) {
      options.alias = {
        'svg-to-deck-local-fonts': resolve(__dirname, 'src/gallery/local-fonts.ts'),
      };
    },
  },
]);
