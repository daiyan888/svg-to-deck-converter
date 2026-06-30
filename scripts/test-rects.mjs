import { Window } from 'happy-dom';
import { readFileSync } from 'node:fs';
import { convertSvgToDeck } from '../src/converter/svg-to-deck.ts';
import { SAMPLE_SVG } from '../src/samples/default-svg.ts';

const window = new Window();
globalThis.window = window as unknown as Window & typeof globalThis;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Node = window.Node;

const result = convertSvgToDeck(SAMPLE_SVG, { extractText: true });

function findComps(items: typeof result.document.content[0]['content'], comp: string, acc: unknown[] = []) {
  for (const node of items) {
    if (node.type === 'svg') {
      walk(node.attrs.commands, comp, acc);
    }
  }
  return acc;
}

function walk(items: { comp: string; props: Record<string, unknown>; children?: unknown[] }[], comp: string, acc: unknown[]) {
  for (const item of items) {
    if (item.comp === comp) acc.push(item.props);
    if (item.children) walk(item.children as typeof items, comp, acc);
  }
}

const svgNode = result.document.content[0].content[0];
if (svgNode.type !== 'svg') throw new Error('expected svg');

const rects = findComps([svgNode], 'rect');
const paths = findComps([svgNode], 'path');

console.log('commandCount', result.stats.commandCount);
console.log('rect count', rects.length);
console.log('path count', paths.length);
console.log('sample rects', rects.slice(0, 4));
console.log('viewBox', svgNode.attrs.viewBox);
console.log('deckNodes', result.document.content.length);
