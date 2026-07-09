/**
 * 下载 AntV Infographic 内置字体的 result.css，写入 font-manifest.json。
 * 运行：npm run download:fonts
 *
 * 说明：Node SSR 的 embedFonts 依赖这些 CSS；woff2 子集数量极大（千级），
 * 默认只缓存 CSS。运行时对 woff2 请求做本地拦截并快速失败，避免远程挂起导致 SSR 超时。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../src/gallery/font-manifest.json');
const BASE_FONT_URL = 'https://assets.antv.antgroup.com';

const BUILT_IN_FONTS = [
  {
    fontFamily: 'Alibaba PuHuiTi',
    weights: {
      regular: 'AlibabaPuHuiTi-Regular',
      bold: 'AlibabaPuHuiTi-Bold',
    },
  },
  {
    fontFamily: 'Source Han Sans',
    weights: { regular: 'SourceHanSansCN-Regular' },
  },
  {
    fontFamily: 'Source Han Serif',
    weights: { regular: 'SourceHanSerifCN-Regular' },
  },
  {
    fontFamily: 'LXGW WenKai',
    weights: { regular: 'LXGWWenKai-Regular' },
  },
  {
    fontFamily: '851tegakizatsu',
    weights: { regular: '851tegakizatsu-Regular' },
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 去掉远程 woff2 url，只保留 local(...)，避免 SSR 再去拉字体文件。
 * 文本测量在 Node 侧由 measury 本地字形数据完成，不依赖这些 woff2。
 */
function stripRemoteFontUrls(cssText) {
  return cssText.replace(
    /src\s*:\s*([^;]+);/gi,
    (_match, srcValue) => {
      const locals = [...String(srcValue).matchAll(/local\(([^)]*)\)/gi)].map((m) => m[0]);
      if (locals.length === 0) {
        return 'src: local("sans-serif");';
      }
      return `src: ${locals.join(', ')};`;
    },
  );
}

async function fetchText(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(500 * (attempt + 1));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const cssByUrl = {};
  const missing = [];

  for (const font of BUILT_IN_FONTS) {
    for (const [weightName, folder] of Object.entries(font.weights)) {
      const url = `${BASE_FONT_URL}/${folder}/result.css`;
      process.stdout.write(`${font.fontFamily} / ${weightName} ... `);
      try {
        const css = await fetchText(url);
        cssByUrl[url] = stripRemoteFontUrls(css);
        console.log('OK', `${(css.length / 1024).toFixed(1)}KB`);
      } catch (error) {
        missing.push(url);
        console.log('ERR', error instanceof Error ? error.message : error);
      }
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: BASE_FONT_URL,
    stats: {
      fonts: BUILT_IN_FONTS.length,
      cssFiles: Object.keys(cssByUrl).length,
      missing: missing.length,
    },
    cssByUrl,
    missing,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`Cached ${manifest.stats.cssFiles} CSS files, missing ${manifest.stats.missing}`);
  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
