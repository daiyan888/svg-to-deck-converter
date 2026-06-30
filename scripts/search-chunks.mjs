const chunks = [
  '/_next/static/chunks/765-4a9cedce8620c74a.js',
  '/_next/static/chunks/3949d334-3d4eddbb4d989baa.js',
  '/_next/static/chunks/360-ef5e7c544c0b0a08.js',
  '/_next/static/chunks/pages/_app-79fce728354456d7.js',
];

for (const path of chunks) {
  const res = await fetch(`https://infographic.antv.vision${path}`);
  const js = await res.text();

  const prefixes = [
    'hierarchy-tree-',
    'hierarchy-mindmap-',
    'sequence-interaction-',
    'relation-dagre-',
  ];

  console.log(`\n=== ${path} (${js.length}) ===`);
  for (const prefix of prefixes) {
    const re = new RegExp(`"${prefix}[a-z0-9-]*"`, 'g');
    const matches = [...new Set([...js.matchAll(re)].map((m) => m[0].slice(1, -1)))];
    console.log(`${prefix}: ${matches.length}`);
    if (matches.length > 0 && matches.length <= 10) console.log(matches);
    else if (matches.length > 10) console.log(matches.slice(0, 8), '...');
  }
}

// Search for gallery template list structure in _app
const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const appJs = await appRes.text();

const galleryListIdx = appJs.indexOf('seriesCount');
console.log('\nseriesCount context not useful');

// Look for getTemplates or templateList
for (const term of ['getTemplates', 'templateList', 'GALLERY', 'galleryTemplates', 'TEMPLATE_LIST']) {
  const idx = appJs.indexOf(term);
  if (idx >= 0) console.log(`${term} at ${idx}`);
}

// hierarchy-tree might use pattern generation - search sO( pattern
const idx = appJs.indexOf('hierarchy-tree');
console.log('\nAll hierarchy-tree occurrences:');
let pos = 0;
let count = 0;
while ((pos = appJs.indexOf('hierarchy-tree', pos)) !== -1 && count < 20) {
  console.log(`  ${pos}: ${appJs.slice(pos, pos + 80)}`);
  pos += 1;
  count += 1;
}
