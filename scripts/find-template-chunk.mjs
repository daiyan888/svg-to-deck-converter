const chunkRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/gallery/%5Btemplate%5D-f0a6b447c669a467.js',
);
const js = await chunkRes.text();
console.log('chunk length:', js.length);

for (const term of [
  'chart-bar-plain-text',
  'defaultSyntax',
  'defaultCode',
  'initialCode',
  '年度营收',
  'getStaticProps',
  'syntax',
  'TEMPLATE',
]) {
  const idx = js.indexOf(term);
  if (idx >= 0) {
    console.log(`\n${term} at ${idx}:`);
    console.log(js.slice(Math.max(0, idx - 100), idx + 500));
  } else {
    console.log(`${term}: not found`);
  }
}
