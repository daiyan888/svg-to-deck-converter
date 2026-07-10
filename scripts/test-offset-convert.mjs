import { Window } from 'happy-dom';

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Node = window.Node;

const { convertSvgToDeck } = await import('../dist/browser/index.js');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect x="10" y="10" width="30" height="30" fill="red"></rect>
<text x="50" y="50" font-size="14">Hello</text>
</svg>`;

const result = convertSvgToDeck(svg, { extractText: true, offsetTop: 20, offsetLeft: 30 });
const nodes = result.document.content;

const checks = [
  ['svg deckNode top', nodes[0]?.attrs.top === 20],
  ['svg deckNode left', nodes[0]?.attrs.left === 30],
  ['text deckNode exists', nodes.length > 1],
  ['text deckNode top includes offset', nodes[1]?.attrs.top === nodes[1].attrs.top && nodes[1].attrs.top >= 20],
  ['text deckNode left includes offset', nodes[1]?.attrs.left === nodes[1].attrs.left && nodes[1].attrs.left >= 30],
];

const baseline = convertSvgToDeck(svg, { extractText: true });
const baselineText = baseline.document.content[1];
const offsetText = nodes[1];
checks.push(['text top delta', offsetText.attrs.top === baselineText.attrs.top + 20]);
checks.push(['text left delta', offsetText.attrs.left === baselineText.attrs.left + 30]);

let failed = false;
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  if (!ok) {
    failed = true;
  }
}

if (failed) {
  console.log('\nOffset nodes:', JSON.stringify(nodes.map((n) => n.attrs), null, 2));
  console.log('Baseline text attrs:', baselineText?.attrs);
  process.exit(1);
}

console.log('\nAll deckNode offset checks passed.');
