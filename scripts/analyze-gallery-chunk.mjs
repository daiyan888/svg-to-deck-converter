const res = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/gallery-3829c7c7441e8fab.js',
);
const js = await res.text();
console.log('chunk length:', js.length);

// Find template slug arrays or objects
for (const term of ['templates', 'gallery', 'hierarchy-tree', 'chart-bar', 'slug', '276']) {
  const idx = js.indexOf(term);
  console.log(`${term}: ${idx >= 0 ? idx : 'not found'}`);
}

// Slugs in gallery URLs
const urlSlugs = [...js.matchAll(/gallery\/([a-z0-9-]+)/g)].map((m) => m[1]);
console.log('\nURL slugs:', [...new Set(urlSlugs)].length);
console.log([...new Set(urlSlugs)].slice(0, 20));

// Quoted slug-like strings
const quoted = [...js.matchAll(/"([a-z][a-z0-9-]{8,})"/g)].map((m) => m[1]);
const filtered = [...new Set(quoted)].filter(
  (s) =>
    s.startsWith('chart-') ||
    s.startsWith('compare-') ||
    s.startsWith('hierarchy-') ||
    s.startsWith('list-') ||
    s.startsWith('quadrant-') ||
    s.startsWith('relation-') ||
    s.startsWith('sequence-'),
);
console.log('\nFiltered quoted slugs:', filtered.length);
console.log(filtered.slice(0, 30));

// Look for array of template objects
const arrayIdx = js.indexOf('hierarchy-tree');
console.log('\nContext around hierarchy-tree:');
console.log(js.slice(arrayIdx - 200, arrayIdx + 800));
