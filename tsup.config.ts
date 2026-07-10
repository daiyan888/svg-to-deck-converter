import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Options } from 'tsup';

const distDir = resolve(__dirname, 'dist');
const browserOutDir = resolve(distDir, 'browser');
const nodeOutDir = resolve(distDir, 'node');

const shared: Options = {
  tsconfig: 'tsconfig.lib.json',
  sourcemap: true,
  splitting: false,
  treeshake: true,
  noExternal: [/@antv\/infographic/],
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

function cleanNestedBuildArtifacts(outDir: string) {
  for (const name of ['converter', 'gallery', 'types', 'stubs', 'theme']) {
    rmSync(resolve(outDir, name), { recursive: true, force: true });
  }
}

/**
 * 产物目录：
 *   dist/browser/index.js|cjs  — 浏览器
 *   dist/node/index.js|cjs     — Node / SSR
 *   dist/browser/index.d.ts    — 类型（两入口共用）
 */
export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    outDir: browserOutDir,
    format: ['esm'],
    platform: 'browser',
    clean: true,
    dts: true,
    esbuildOptions(options) {
      options.alias = browserAlias;
    },
    async onSuccess() {
      cleanNestedBuildArtifacts(browserOutDir);
    },
  },
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    outDir: browserOutDir,
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
    entry: { index: 'src/index.ts' },
    outDir: nodeOutDir,
    format: ['esm'],
    platform: 'node',
    clean: true,
    dts: false,
    noExternal: [...nodeNoExternal],
    banner: {
      js: "import { createRequire as __svgToDeckCreateRequire } from 'node:module'; const require = __svgToDeckCreateRequire(import.meta.url);",
    },
    esbuildOptions(options) {
      options.alias = nodeAlias;
    },
    async onSuccess() {
      cleanNestedBuildArtifacts(nodeOutDir);
    },
  },
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    outDir: nodeOutDir,
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
