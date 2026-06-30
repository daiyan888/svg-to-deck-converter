import { writeFileSync } from 'node:fs';

const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const html = await galleryRes.text();

// Template cards may contain slug in various places
const slugPatterns = [
  /\/gallery\/([a-z0-9-]+)/g,
  /"template":"([a-z0-9-]+)"/g,
  /data-template="([a-z0-9-]+)"/g,
  /chart-[a-z0-9-]+/g,
];

for (const pattern of slugPatterns) {
  const matches = [...html.matchAll(pattern)].map((m) => m[1] ?? m[0]);
  const unique = [...new Set(matches)];
  console.log(`Pattern ${pattern}: ${unique.length} matches`);
  if (unique.length > 0 && unique.length < 50) console.log(unique);
  if (unique.length >= 50) console.log(unique.slice(0, 10), '...');
}

// Look for Use button links - search for plain-text etc
const idx = html.indexOf('plain-text');
console.log('\nplain-text context:', html.slice(idx - 100, idx + 200));

// Search for template slugs in gallery cards area
const gridIdx = html.indexOf('grid-cols-1 md:grid-cols-2');
console.log('\nFirst grid card area:', html.slice(gridIdx, gridIdx + 3000).match(/[a-z]+-[a-z0-9-]{5,}/g)?.slice(0, 30));
