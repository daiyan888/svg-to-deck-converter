const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const html = await galleryRes.text();

for (const term of ['hierarchy-tree', 'hierarchy-mindmap', 'sequence-interaction', 'relation-dagre', '276']) {
  const count = (html.match(new RegExp(term, 'g')) || []).length;
  console.log(`${term}: ${count} occurrences`);
}

// Find all unique template-like slugs in gallery HTML
const slugLike = [...html.matchAll(/\b([a-z]+-[a-z0-9]+(?:-[a-z0-9]+){1,6})\b/g)]
  .map((m) => m[1])
  .filter((s) => s.includes('-') && !s.startsWith('grid-') && !s.startsWith('text-'));

const infographicSlugs = [...new Set(slugLike)].filter(
  (s) =>
    s.startsWith('chart-') ||
    s.startsWith('compare-') ||
    s.startsWith('hierarchy-') ||
    s.startsWith('list-') ||
    s.startsWith('quadrant-') ||
    s.startsWith('relation-') ||
    s.startsWith('sequence-'),
);

console.log('\nInfographic-like slugs in gallery HTML:', infographicSlugs.length);
console.log(infographicSlugs.slice(0, 30));

// Check other chunks from gallery
const jsUrls = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
for (const url of jsUrls) {
  const res = await fetch(`https://infographic.antv.vision${url}`);
  const chunk = await res.text();
  for (const term of ['hierarchy-tree', 'hierarchy-mindmap', 'sequence-interaction', 'relation-dagre']) {
    if (chunk.includes(term)) {
      const re = new RegExp(`"${term}[a-z0-9-]*"`, 'g');
      const matches = [...new Set([...chunk.matchAll(re)].map((m) => m[0]))];
      console.log(`\n${url} has ${term}: ${matches.length}`);
      console.log(matches.slice(0, 5));
    }
  }
}
