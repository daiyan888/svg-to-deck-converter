import { Window } from 'happy-dom';

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Node = window.Node;

const { convertSvgToDeck } = await import('../src/converter/svg-to-deck.ts');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1783FF"></stop><stop offset="100%" stop-color="#74b5ff"></stop></linearGradient></defs>
<rect x="10" y="10" width="30" height="30" fill="url(#g1)"></rect>
</svg>`;

const result = convertSvgToDeck(svg, { extractText: false });
const cmds = result.document.content[0].content[0].attrs.commands;
console.log(JSON.stringify(cmds, null, 2));
