import { Window } from 'happy-dom';

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Node = window.Node;

const { convertSvgToDeck } = await import('../dist/index.js');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><filter id="compact-shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.15"></feDropShadow></filter></defs>
<rect x="10" y="10" width="30" height="30" fill="red" filter="url(#compact-shadow)"></rect>
</svg>`;

const result = convertSvgToDeck(svg, { extractText: false });
const cmds = result.document.content[0].content[0].attrs.commands;

const defs = cmds.find((c) => c.comp === 'defs');
const filter = defs?.children?.[0];
const feDropShadow = filter?.children?.[0];

const checks = [
  ['defs comp', defs?.comp === 'defs'],
  ['filter comp', filter?.comp === 'filter'],
  ['filter id', filter?.id === 'compact-shadow'],
  ['feDropShadow comp', feDropShadow?.comp === 'feDropShadow'],
  ['feDropShadow dx', feDropShadow?.dx === 0],
  ['feDropShadow dy', feDropShadow?.dy === 2],
  ['feDropShadow stdDeviation', feDropShadow?.stdDeviation === 2],
  ['feDropShadow floodOpacity', feDropShadow?.floodOpacity === 0.15],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(ok ? '✓' : '✗', name);
  if (!ok) {
    failed = true;
  }
}

if (failed) {
  console.log('\nActual output:');
  console.log(JSON.stringify(cmds, null, 2));
  process.exit(1);
}

console.log('\nAll filter conversion checks passed.');
