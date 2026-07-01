import { Window } from 'happy-dom';
import { convertSvgToDeck } from '../src/converter/svg-to-deck.ts';
import type { CommandsItem } from '../src/types/deck.ts';
import { SAMPLE_SVG } from '../dev/samples/default-svg.ts';

const window = new Window();
(globalThis as typeof globalThis & { window: Window }).window = window as unknown as Window;
globalThis.document = window.document;
globalThis.DOMParser = window.DOMParser;
globalThis.Node = window.Node;

const result = convertSvgToDeck(SAMPLE_SVG, { extractText: true });
const svgNode = result.document.content[0].content[0];
if (svgNode.type !== 'svg') throw new Error('expected svg');

function count(
  items: { comp: string; children?: { comp: string; children?: unknown[] }[] }[],
  comp: string,
): number {
  let total = 0;
  for (const item of items) {
    if (item.comp === comp) total += 1;
    if (item.children) total += count(item.children, comp);
  }
  return total;
}

console.log('rects', count(svgNode.attrs.commands, 'rect'));
console.log('paths', count(svgNode.attrs.commands, 'path'));
console.log('gs', count(svgNode.attrs.commands, 'g'));

const rects: Record<string, unknown>[] = [];
function collectRects(items: CommandsItem[]) {
  for (const item of items) {
    if (item.comp === 'rect') {
      const { comp: _comp, children: _children, ...attrs } = item;
      rects.push(attrs);
    }
    if (item.children) collectRects(item.children);
  }
}
collectRects(svgNode.attrs.commands);
console.log('bar rects', rects.filter((r) => r.fill && r.fill !== '#ffffff'));
