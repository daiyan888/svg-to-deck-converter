/**
 * 扫描 Gallery 全部模板的 icon / illus 引用，下载 SVG 并写入 resource-manifest.json。
 * 运行：npm run download:resources
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTemplates } from '@antv/infographic';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '../src/gallery/resource-manifest.json');

const ICON_SERVICE_URLS = [
  'https://www.weavefox.cn/api/v1/infographic/icon',
  'https://lab.weavefox.cn/api/v1/infographic/icon',
];
const GALLERY_ORIGIN = 'https://infographic.antv.vision';

const ICON_RE = /^\s*icon\s+(\S+)/gm;
const ILLUS_RE = /^\s*illus\s+(\S+)/gm;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikeSvg(text) {
  const trimmed = text.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<symbol');
}

async function fetchText(url, retries = 2) {
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

async function fetchFromWeavefox(query) {
  const params = new URLSearchParams({ text: query, topK: '1' });
  for (const base of ICON_SERVICE_URLS) {
    try {
      const response = await fetch(`${base}?${params.toString()}`);
      if (!response.ok) {
        continue;
      }
      const result = await response.json();
      if (!result?.success || !Array.isArray(result.data) || !result.data[0]) {
        continue;
      }
      const item = result.data[0];
      if (looksLikeSvg(item)) {
        return item;
      }
      if (typeof item === 'string') {
        return await fetchText(item);
      }
    } catch {
      // try next endpoint
    }
  }
  return null;
}

async function fetchIconFallback(query) {
  const candidates = [query];
  if (query.includes('/')) {
    const [collection, name] = query.split('/');
    if (name.endsWith('-fill')) {
      candidates.push(`${collection}/${name.replace(/-fill$/, '-line')}`);
    }
    if (name.endsWith('-line')) {
      candidates.push(`${collection}/${name.replace(/-line$/, '-fill')}`);
    }
    if (name.includes('-2-')) {
      candidates.push(`${collection}/${name.replace('-2-', '-')}`);
      candidates.push(`${collection}/${name.replace('-2-', '-2')}`);
    }
  }

  for (const candidate of candidates) {
    if (!candidate.includes('/')) {
      continue;
    }
    try {
      const url = `https://api.iconify.design/${candidate}.svg`;
      const svg = await fetchText(url, 3);
      if (looksLikeSvg(svg)) {
        return svg;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function fetchIllusFallback(query) {
  const urls = [
    `https://raw.githubusercontent.com/balazser/undraw-svg-collection/refs/heads/main/svgs/${query}.svg`,
    `https://cdn.jsdelivr.net/gh/balazser/undraw-svg-collection@main/svgs/${query}.svg`,
  ];
  for (const url of urls) {
    try {
      const svg = await fetchText(url);
      if (looksLikeSvg(svg)) {
        return svg;
      }
    } catch {
      // try next
    }
  }
  return null;
}

const ICON_ALIASES = {
  'mingcute/receive-line': 'mingcute/receive-money-line',
};

async function downloadResource(scene, data) {
  if (scene === 'icon' && data.includes('/')) {
    const iconify = await fetchIconFallback(data);
    if (iconify) {
      return iconify;
    }
  }

  const weavefox = await fetchFromWeavefox(data);
  if (weavefox) {
    return weavefox;
  }

  if (scene === 'icon') {
    const alias = ICON_ALIASES[data];
    if (alias) {
      const aliased = await downloadResource('icon', alias);
      if (aliased) {
        return aliased;
      }
    }
    return fetchIconFallback(data);
  }

  return fetchIllusFallback(data);
}

function extractSyntaxFromHtml(html) {
  const match = html.match(/<pre class="sr-only"[^>]*>([\s\S]*?)<\/pre>/);
  return match?.[1]?.trim() ?? '';
}

async function fetchTemplateSyntax(slug, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${GALLERY_ORIGIN}/gallery/${slug}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      return extractSyntaxFromHtml(html);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(800 * (attempt + 1));
    }
  }
  throw new Error('unreachable');
}

async function collectResources(slugs) {
  const icons = new Set();
  const illus = new Set();
  const failedSlugs = [];

  async function scanSlug(slug) {
    try {
      const syntax = await fetchTemplateSyntax(slug, 5);
      if (!syntax) {
        failedSlugs.push(slug);
        return;
      }
      for (const match of syntax.matchAll(ICON_RE)) {
        icons.add(match[1]);
      }
      for (const match of syntax.matchAll(ILLUS_RE)) {
        illus.add(match[1]);
      }
    } catch (error) {
      failedSlugs.push(slug);
      console.warn(`[skip] ${slug}:`, error instanceof Error ? error.message : error);
    }
  }

  const concurrency = 4;
  let index = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (index < slugs.length) {
        const current = index++;
        await scanSlug(slugs[current]);
      }
    }),
  );

  if (failedSlugs.length > 0) {
    console.log(`Retrying ${failedSlugs.length} failed templates sequentially...`);
    for (const slug of failedSlugs) {
      await sleep(300);
      await scanSlug(slug);
    }
  }

  return { icons, illus };
}

async function main() {
  const slugs = getTemplates();
  let existing = { resources: {} };
  try {
    existing = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  } catch {
    // fresh run
  }

  console.log(`Scanning ${slugs.length} gallery templates...`);
  const { icons, illus } = await collectResources(slugs);
  console.log(`Found ${icons.size} icons, ${illus.size} illustrations`);

  const resources = { ...(existing.resources ?? {}) };
  const missing = [];
  const pendingMissing = new Set(existing.missing ?? []);
  const entries = [
    ...[...icons].map((data) => ({ scene: 'icon', data })),
    ...[...illus].map((data) => ({ scene: 'illus', data })),
    ...[...pendingMissing].map((key) => {
      const [scene, ...rest] = key.split(':');
      return { scene, data: rest.join(':') };
    }),
  ];
  const seen = new Set();

  for (const [index, { scene, data }] of entries.entries()) {
    const key = `${scene}:${data}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (resources[key] && !pendingMissing.has(key)) {
      console.log(`[${index + 1}/${entries.length}] ${key} ... cached`);
      continue;
    }
    process.stdout.write(`[${index + 1}/${entries.length}] ${key} ... `);
    try {
      const svg = await downloadResource(scene, data);
      if (!svg) {
        missing.push(key);
        console.log('MISS');
        continue;
      }
      resources[key] = svg;
      console.log('OK');
    } catch (error) {
      missing.push(key);
      console.log('ERR', error instanceof Error ? error.message : error);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'gallery-templates',
    stats: {
      icons: icons.size,
      illus: illus.size,
      downloaded: Object.keys(resources).length,
      missing: missing.length,
    },
    resources,
    missing: [...new Set(missing)],
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`Downloaded ${manifest.stats.downloaded}, missing ${manifest.stats.missing}`);
  if (missing.length > 0) {
    console.log('Missing keys:', missing.slice(0, 20).join(', '), missing.length > 20 ? '...' : '');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
