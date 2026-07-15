import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { convertSvgToDeck } from './svg-to-deck.js';
import type { MultiBlockContainerNode, TextNode } from '../types/deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

function findTextByContent(
  result: ReturnType<typeof convertSvgToDeck>,
  text: string,
): { node: ReturnType<typeof convertSvgToDeck>['document']['content'][number]; mbc: MultiBlockContainerNode } | null {
  for (const deckNode of result.document.content) {
    const child = deckNode.content[0];
    if (child.type !== 'multiBlockContainer') continue;
    const textNode = child.content[0]?.content[0] as TextNode | undefined;
    if (textNode?.text === text) {
      return { node: deckNode, mbc: child };
    }
  }
  return null;
}

function textStyleFontFamily(mbc: MultiBlockContainerNode): string | undefined {
  const textNode = mbc.content[0]?.content[0] as TextNode | undefined;
  const mark = textNode?.marks?.find((m) => m.type === 'textStyle');
  return mark && 'attrs' in mark ? mark.attrs.fontFamily : undefined;
}

describe('foreignObject font inheritance and width slack', () => {
  it('inherits svg font-family when span omits font-family', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" font-family="Alibaba PuHuiTi" viewBox="0 0 400 100">
      <foreignObject x="131" y="10" width="138" height="35">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <span style="font-size:24px;white-space:pre-wrap;word-break:break-word">TCP三次握手</span>
        </div>
      </foreignObject>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: true });
    const found = findTextByContent(result, 'TCP三次握手');
    expect(found).not.toBeNull();
    expect(textStyleFontFamily(found!.mbc)).toBe('Alibaba PuHuiTi');
  });

  it('prefers span font-family over svg inheritance', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" font-family="Alibaba PuHuiTi" viewBox="0 0 400 100">
      <foreignObject x="0" y="0" width="100" height="24">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <span style="font-size:14px;font-family:Inter">Label</span>
        </div>
      </foreignObject>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: true });
    const found = findTextByContent(result, 'Label');
    expect(found).not.toBeNull();
    expect(textStyleFontFamily(found!.mbc)).toBe('Inter');
  });

  it('adds width slack and keeps horizontal center for measured FO', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" font-family="Alibaba PuHuiTi" viewBox="0 0 400 100">
      <foreignObject x="131" y="10" width="138" height="35">
        <div xmlns="http://www.w3.org/1999/xhtml">
          <span style="font-size:24px">TCP三次握手</span>
        </div>
      </foreignObject>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: true });
    const found = findTextByContent(result, 'TCP三次握手');
    expect(found).not.toBeNull();

    const { width, left } = found!.node.attrs;
    expect(width).toBe(Math.ceil(138 * 1.03));
    // 余量向两侧均分，中心仍在 131 + 138/2
    expect(left + width / 2).toBeCloseTo(131 + 138 / 2, 5);
  });
});
