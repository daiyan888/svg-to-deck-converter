const appRes = await fetch(
  'https://infographic.antv.vision/_next/static/chunks/pages/_app-79fce728354456d7.js',
);
const appJs = await appRes.text();

const slug = 'chart-bar-plain-text';
const idx = appJs.indexOf(`"${slug}"`);
console.log(`"${slug}" at:`, idx);
if (idx >= 0) {
  console.log(appJs.slice(idx, idx + 2000));
}

// Look for syntax strings near template definitions
const syntaxIdx = appJs.indexOf('infographic chart-bar');
console.log('\n"infographic chart-bar" at:', syntaxIdx);
if (syntaxIdx >= 0) {
  console.log(appJs.slice(syntaxIdx - 50, syntaxIdx + 500));
}

// Find all default syntax blocks
const syntaxBlocks = [...appJs.matchAll(/infographic [a-z0-9-]+[\s\S]{0,800}?data[\s\S]{0,1200}/g)];
console.log('\nSyntax blocks found:', syntaxBlocks.length);
if (syntaxBlocks[0]) {
  console.log('First block preview:\n', syntaxBlocks[0][0].slice(0, 600));
}
