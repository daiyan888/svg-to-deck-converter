const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const js = await appRes.text();

for (const prefix of [
  'hierarchy-tree',
  'hierarchy-mindmap',
  'sequence-interaction',
  'relation-dagre',
  'compare-quadrant-quarter',
  'compare-quadrant-simple',
]) {
  const re = new RegExp(`"${prefix}[a-z0-9-]*":\\{design:\\{`, 'g');
  const matches = [...js.matchAll(re)].map((m) => m[0].slice(1, -10));
  console.log(`${prefix}: ${matches.length}`);
  if (matches.length) console.log(' ', matches.slice(0, 5));
}

// Also search all JS chunks from gallery page
const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const html = await galleryRes.text();
const jsUrls = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);

let totalExtra = 0;
for (const url of jsUrls) {
  const res = await fetch(`https://infographic.antv.vision${url}`);
  const chunk = await res.text();
  const re = /"([a-z0-9][a-z0-9-]*)":\{design:\{/g;
  const slugs = [...chunk.matchAll(re)].map((m) => m[1]);
  if (slugs.length) {
    console.log(`\n${url}: ${slugs.length} design templates`);
    totalExtra += slugs.length;
    console.log(' sample:', slugs.slice(0, 5));
  }
}
