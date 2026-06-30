import { writeFileSync } from 'node:fs';

const galleryRes = await fetch('https://infographic.antv.vision/gallery');
const html = await galleryRes.text();

// Extract category sections from SSR HTML
const categoryRegex =
  /<span>([^<]+)<\/span><span[^>]*>(\d+) templates<\/span>/g;
const categories = [];
let m;
while ((m = categoryRegex.exec(html)) !== null) {
  categories.push({ id: m[1], count: Number(m[2]) });
}
console.log('Categories from HTML:', categories.length);
console.log(categories);

// Extract template links
const linkRegex = /href="\/gallery\/([^"]+)"/g;
const slugs = [...new Set([...html.matchAll(linkRegex)].map((x) => x[1]))];
console.log('\nTemplate slugs from HTML:', slugs.length);
console.log(slugs.slice(0, 20));

// Extract from _app bundle
const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const appJs = await appRes.text();

// Template keys look like "chart-bar-plain-text":{design:...
const templateKeyRegex = /"([a-z0-9-]+)":\{design:\{/g;
const bundleSlugs = [...new Set([...appJs.matchAll(templateKeyRegex)].map((x) => x[1]))];
console.log('\nTemplate slugs from bundle:', bundleSlugs.length);
console.log(bundleSlugs.slice(0, 20));

// Check example page for syntax/render data
const exampleRes = await fetch('https://infographic.antv.vision/gallery/chart-bar-plain-text');
const exampleHtml = await exampleRes.text();

const syntaxMatch = exampleHtml.match(/syntax\.txt[\s\S]{0,2000}/);
console.log('\nSyntax section:', syntaxMatch?.[0]?.slice(0, 500));

// Look for embedded template data in example page scripts
for (const script of [...exampleHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]) {
  const content = script[1].trim();
  if (content.length > 200 && (content.includes('chart-bar') || content.includes('syntax'))) {
    console.log('\nExample script length:', content.length);
    console.log(content.slice(0, 400));
  }
}

// Check if there's an API
const apiCandidates = [
  'https://infographic.antv.vision/api/templates',
  'https://infographic.antv.vision/api/gallery',
];
for (const url of apiCandidates) {
  const res = await fetch(url);
  console.log(`\n${url}: ${res.status}`);
}
