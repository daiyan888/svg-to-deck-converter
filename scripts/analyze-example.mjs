import { writeFileSync } from 'node:fs';

const exampleRes = await fetch('https://infographic.antv.vision/gallery/chart-bar-plain-text');
const html = await exampleRes.text();
writeFileSync('scripts/example-page.html', html);

console.log('HTML length:', html.length);

// All SVG tags
const svgs = [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)];
console.log('SVG count:', svgs.length);
for (const [i, m] of svgs.entries()) {
  console.log(`SVG ${i}: ${m[0].length} chars, preview: ${m[0].slice(0, 120)}...`);
}

// w-full h-full section
const wFullIdx = html.indexOf('w-full h-full');
console.log('\nw-full h-full at:', wFullIdx);
if (wFullIdx >= 0) {
  console.log(html.slice(wFullIdx - 100, wFullIdx + 800));
}

// JS chunks on example page
const jsUrls = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
console.log('\nJS files:', jsUrls);

for (const url of jsUrls) {
  const res = await fetch(`https://infographic.antv.vision${url}`);
  const js = await res.text();
  if (js.includes('outerHTML') || js.includes('w-full') || js.includes('renderToString')) {
    console.log(`\nInteresting chunk: ${url} (${js.length})`);
    for (const term of ['outerHTML', 'w-full h-full', 'syntax', 'getSVG', 'toSVG', 'serialize']) {
      const idx = js.indexOf(term);
      if (idx >= 0) console.log(`  ${term} at ${idx}: ...${js.slice(idx, idx + 80)}...`);
    }
  }
}
