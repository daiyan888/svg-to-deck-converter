const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const galleryHtml = await galleryRes.text();
console.log('gallery html length:', galleryHtml.length);

const patterns = ['__NEXT_DATA__', 'chart-bar', 'templates', 'galleryItems', '276'];
for (const p of patterns) {
  const i = galleryHtml.indexOf(p);
  console.log(p, i >= 0 ? `found at ${i}` : 'not found');
}

const slugMatches = [...galleryHtml.matchAll(/"slug":"([^"]+)"/g)].map((m) => m[1]);
console.log('slug count:', slugMatches.length, 'sample:', slugMatches.slice(0, 10));

const idMatches = [...galleryHtml.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]);
console.log('id count:', idMatches.length, 'sample:', idMatches.slice(0, 10));

const exampleRes = await fetch('https://infographic.antv.vision/gallery/chart-bar-plain-text');
const exampleHtml = await exampleRes.text();
console.log('\nexample html length:', exampleHtml.length);

const svgMatch = exampleHtml.match(/<svg[\s\S]*?<\/svg>/);
console.log('svg in html:', svgMatch ? `found (${svgMatch[0].length} chars)` : 'not found');

const wFullMatch = exampleHtml.match(/w-full h-full/);
console.log('w-full h-full in html:', wFullMatch ? 'found' : 'not found');

// Try to find API endpoints in JS bundles
const jsUrls = [...galleryHtml.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
console.log('\njs bundles:', jsUrls.length);
