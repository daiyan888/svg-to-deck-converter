import { writeFileSync } from 'node:fs';

const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const html = await galleryRes.text();

// Find all script tags with substantial content
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
console.log('script tags with content:', scripts.filter((s) => s[1].trim().length > 100).length);

for (const [i, m] of scripts.entries()) {
  const content = m[1].trim();
  if (content.includes('chart-bar') || content.includes('templates')) {
    console.log(`\nScript #${i} length ${content.length}, preview:`);
    console.log(content.slice(0, 300));
  }
}

// Search for JSON-like template arrays
const templateIdx = html.indexOf('chart-bar');
console.log('\nchart-bar context:', html.slice(Math.max(0, templateIdx - 200), templateIdx + 400));

// Look for RSC payload or self.__next_f
const nextF = html.indexOf('self.__next_f');
console.log('\nself.__next_f at:', nextF);
if (nextF >= 0) {
  console.log(html.slice(nextF, nextF + 500));
}

// Fetch a JS chunk that might contain gallery data
const jsUrls = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]);
console.log('\nJS chunks:', jsUrls.length);

for (const url of jsUrls.slice(0, 5)) {
  const res = await fetch(`https://infographic.antv.vision${url}`);
  const js = await res.text();
  if (js.includes('chart-bar') || js.includes('hierarchy-tree')) {
    console.log(`\nFound templates in ${url} (${js.length} chars)`);
    const idx = js.indexOf('chart-bar');
    console.log(js.slice(Math.max(0, idx - 100), idx + 300));
  }
}
