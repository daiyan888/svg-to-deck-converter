import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  finalizeSizedConvertResult,
  scaleDeckDocument,
} from './scale-deck.js';
import type { DeckDocument } from '../types/deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

function multiBlockDoc(): DeckDocument {
  return {
    type: 'deck',
    attrs: {
      theme: {
        clrScheme: {
          name: 't',
          dk1: '#000',
          dk2: '#333',
          lt1: '#fff',
          lt2: '#eee',
          accent1: '#1783FF',
          accent2: '#00C9C9',
          accent3: '#F0884D',
          accent4: '#D580FF',
          accent5: '#7863FF',
          accent6: '#60C42D',
        },
      },
    },
    content: [
      {
        type: 'deckNode',
        attrs: { left: 160, top: 115, width: 218, height: 28 },
        content: [
          {
            type: 'svg',
            attrs: {
              width: 218,
              height: 28,
              viewBox: '160 115 218 28',
              commands: [{ comp: 'rect', x: 160, y: 115, width: 218, height: 28, fill: '#1783FF' }],
            },
          },
        ],
      },
      {
        type: 'deckNode',
        attrs: { left: 160, top: 155, width: 272, height: 28 },
        content: [
          {
            type: 'svg',
            attrs: {
              width: 272,
              height: 28,
              viewBox: '160 155 272 28',
              commands: [{ comp: 'rect', x: 160, y: 155, width: 272, height: 28, fill: '#00C9C9' }],
            },
          },
        ],
      },
      {
        type: 'deckNode',
        attrs: { left: 44, top: 139, width: 120, height: 20 },
        content: [
          {
            type: 'multiBlockContainer',
            attrs: { padding: '0px 0px 0px 0px', verticalAlign: 'start' },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '2021年' }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('scaleDeckDocument multi-block', () => {
  it('scales each svg block in place instead of filling the canvas', () => {
    const doc = multiBlockDoc();
    const scaled = scaleDeckDocument(doc, { width: 960, height: 640 }, { width: 730, height: 400 });

    const [bar1, bar2, label] = scaled.content;
    const scale = Math.min(960 / 730, 640 / 400);
    const offsetX = (960 - 730 * scale) / 2;
    const offsetY = (640 - 400 * scale) / 2;

    expect(bar1.attrs.left).toBeCloseTo(160 * scale + offsetX, 5);
    expect(bar1.attrs.top).toBeCloseTo(115 * scale + offsetY, 5);
    expect(bar1.attrs.width).toBeCloseTo(218 * scale, 5);
    expect(bar1.attrs.height).toBeCloseTo(28 * scale, 5);

    expect(bar2.attrs.top).toBeCloseTo(155 * scale + offsetY, 5);
    expect(bar2.attrs.top).not.toBe(bar1.attrs.top);

    // viewBox 保持用户坐标
    expect(bar1.content[0].type).toBe('svg');
    if (bar1.content[0].type === 'svg') {
      expect(bar1.content[0].attrs.viewBox).toBe('160 115 218 28');
      expect(bar1.content[0].attrs.width).toBeCloseTo(218 * scale, 5);
    }

    expect(label.attrs.left).toBeCloseTo(44 * scale + offsetX, 5);
  });

  it('finalizeSizedConvertResult uses SVG viewBox as natural size', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 730 400" width="730" height="400"></svg>`;
    const converted = {
      document: multiBlockDoc(),
      stats: { commandCount: 0, textNodeCount: 0, skippedNodes: [] as string[] },
    };

    const { result } = finalizeSizedConvertResult(svg, converted, { width: 960, height: 640 });
    const [bar1, bar2] = result.document.content;

    // 若误用第一块 218x28 当 natural，两块会都被铺到 0,0 且同尺寸
    expect(bar1.attrs.left).not.toBe(0);
    expect(bar1.attrs.top).not.toBe(0);
    expect(bar2.attrs.top).not.toBe(bar1.attrs.top);
    expect(bar1.attrs.width).toBeLessThan(500);
  });
});
