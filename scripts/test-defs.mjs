import { Window } from 'happy-dom';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1783FF"></stop><stop offset="100%" stop-color="#74b5ff"></stop></linearGradient></defs>
<rect x="10" y="10" width="30" height="30" fill="url(#g1)"></rect>
</svg>`;

const window = new Window();
const doc = window.document;
const parsed = new window.DOMParser().parseFromString(svg, 'image/svg+xml');
const defs = parsed.querySelector('defs');
console.log('defs child count', defs?.children.length);
for (const child of defs?.children ?? []) {
  console.log('child tagName', child.tagName, 'localName', child.localName);
}
