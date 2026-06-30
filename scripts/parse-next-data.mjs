import { writeFileSync } from 'node:fs';

const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const galleryHtml = await galleryRes.text();

const nextDataMatch = galleryHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!nextDataMatch) {
  console.error('No __NEXT_DATA__ found');
  process.exit(1);
}

const nextData = JSON.parse(nextDataMatch[1]);
writeFileSync('scripts/gallery-next-data.json', JSON.stringify(nextData, null, 2));
console.log('keys:', Object.keys(nextData));
console.log('page:', nextData.page);

const pageProps = nextData.props?.pageProps;
console.log('pageProps keys:', pageProps ? Object.keys(pageProps) : 'none');

function summarize(obj, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return '...';
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    if (typeof obj[0] === 'object') {
      return `Array(${obj.length}) [${summarize(obj[0], depth + 1, maxDepth)}]`;
    }
    return `Array(${obj.length})`;
  }
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj).slice(0, 8).map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: Array(${v.length})`;
      if (v && typeof v === 'object') return `${k}: {${Object.keys(v).slice(0, 5).join(', ')}}`;
      return `${k}: ${JSON.stringify(v)?.slice(0, 40)}`;
    });
    return entries.join(', ');
  }
  return String(obj);
}

if (pageProps) {
  for (const [k, v] of Object.entries(pageProps)) {
    console.log(`  ${k}:`, summarize(v));
  }
}

// example page
const exampleRes = await fetch('https://infographic.antv.vision/gallery/chart-bar-plain-text');
const exampleHtml = await exampleRes.text();
const exampleMatch = exampleHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (exampleMatch) {
  const exampleData = JSON.parse(exampleMatch[1]);
  writeFileSync('scripts/example-next-data.json', JSON.stringify(exampleData, null, 2));
  const ep = exampleData.props?.pageProps;
  console.log('\nexample pageProps keys:', ep ? Object.keys(ep) : 'none');
  if (ep) {
    for (const [k, v] of Object.entries(ep)) {
      console.log(`  ${k}:`, summarize(v));
    }
  }
}
