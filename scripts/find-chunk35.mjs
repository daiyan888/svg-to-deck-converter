const chunkRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/35-6220047ddcd5606f.js',
);
const js = await chunkRes.text();

for (const term of [
  'chart-bar-plain-text',
  'defaultSyntax',
  'defaultCode',
  'initialCode',
  'syntax.txt',
  '年度营收',
  'infographic ',
]) {
  const idx = js.indexOf(term);
  console.log(`${term}: ${idx >= 0 ? idx : 'not found'}`);
  if (idx >= 0 && term !== 'infographic ') {
    console.log(js.slice(Math.max(0, idx - 80), idx + 400));
    console.log('---');
  }
}

// Find infographic syntax strings
const matches = [...js.matchAll(/infographic [a-z0-9-]+/g)];
const unique = [...new Set(matches.map((m) => m[0]))];
console.log('\ninfographic slugs in chunk:', unique.length);
console.log(unique.slice(0, 30));
