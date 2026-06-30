import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTemplates } from '@antv/infographic';

const __dirname = dirname(fileURLToPath(import.meta.url));

const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const galleryHtml = await galleryRes.text();

const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const appJs = await appRes.text();

// Categories from gallery SSR
const categoryRegex =
  /<span>([^<]+)<\/span><span[^>]*>(\d+) templates<\/span>/g;
const categories = [];
let m;
while ((m = categoryRegex.exec(galleryHtml)) !== null) {
  categories.push({ id: m[1], count: Number(m[2]) });
}

// All template slugs from bundle - keys before {design:
const slugRegex = /"([a-z0-9][a-z0-9-]*)":\{design:\{/g;
const allSlugs = [...new Set([...appJs.matchAll(slugRegex)].map((x) => x[1]))];
console.log('Total slugs from bundle:', allSlugs.length);

function categoryForSlug(slug) {
  const normalized = slug.toLowerCase();
  for (const cat of categories) {
    const catId = cat.id.toLowerCase().replace(/\s+/g, '-');
    if (catId === 'mind-map' && normalized.startsWith('hierarchy-mindmap')) return cat.id;
    if (catId === 'hierarchy-tree' && normalized.startsWith('hierarchy-tree')) return cat.id;
    if (normalized.startsWith(catId)) return cat.id;
  }
  return 'other';
}

const templatesByCategory = new Map();
for (const slug of allSlugs) {
  const cat = categoryForSlug(slug);
  if (!templatesByCategory.has(cat)) templatesByCategory.set(cat, []);
  templatesByCategory.get(cat).push(slug);
}

console.log('\nCategory mapping:');
let totalMapped = 0;
for (const cat of categories) {
  const templates = templatesByCategory.get(cat.id) ?? [];
  totalMapped += templates.length;
  console.log(`  ${cat.id}: expected ${cat.count}, found ${templates.length}`);
  if (templates.length !== cat.count) {
    console.log('    slugs:', templates);
  }
}

const other = templatesByCategory.get('other') ?? [];
console.log(`\nUnmapped (other): ${other.length}`);
if (other.length) console.log(other.slice(0, 20));

// Build manifest
const manifest = {
  source: 'https://infographic.antv.vision/gallery',
  fetchedAt: new Date().toISOString(),
  totalTemplates: allSlugs.length,
  totalCategories: categories.length,
  categories: categories.map((cat) => ({
    ...cat,
    templates: (templatesByCategory.get(cat.id) ?? []).map((slug) => ({
      slug,
      url: `https://infographic.antv.vision/gallery/${slug}`,
    })),
  })),
  unmapped: other,
};

writeFileSync(
  join(__dirname, '../src/gallery/manifest.json'),
  JSON.stringify(manifest, null, 2),
);
console.log('\nWrote src/gallery/manifest.json');
