import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from '@antv/infographic/ssr';
import { convertSvgToDeck } from './svg-to-deck.js';
import type { SvgNode } from '../types/deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

describe('axis line group kept together', () => {
  it('keeps axis line + ticks in one svg block with fill=none', async () => {
    const svg = await renderToString({
      template: 'chart-bar-plain-text',
      data: {
        title: '年度营收增长',
        desc: 'desc',
        values: [
          { label: '2021年', value: 120 },
          { label: '2022年', value: 150 },
          { label: '2023年', value: 190 },
          { label: '2024年', value: 240 },
        ],
      },
      width: 960,
      height: 640,
    });

    const result = convertSvgToDeck(svg, { extractText: true });
    const axisNodes = result.document.content.filter((n) => {
      if (n.content[0].type !== 'svg') return false;
      return JSON.stringify(n.content[0].attrs.commands).includes('M160 180 L640 180');
    });

    expect(axisNodes.length).toBe(1);
    const node = axisNodes[0];
    const cmds = JSON.stringify((node.content[0] as SvgNode).attrs.commands);

    // 轴线与刻度在同一块里
    expect(cmds).toContain('M159.5 180 L159.5 186');
    expect(cmds).toContain('fill":"none"');
    expect(cmds).toContain('strokeWidth":1');

    // 合并后高度应明显大于单线 1~3px
    expect(node.attrs.height).toBeGreaterThanOrEqual(8);
    expect(node.attrs.width).toBeGreaterThan(100);
  }, 30000);
});
