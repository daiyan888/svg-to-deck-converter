import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from '@antv/infographic/ssr';
import { convertSvgToDeck } from './svg-to-deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

describe('convertSvgToDeck with AntV SSR svg', () => {
  it('splits chart-bar-plain-text into many svg blocks plus text', async () => {
    const svg = await renderToString({
      template: 'chart-bar-plain-text',
      data: {
        title: '年度营收增长',
        desc: '展示近三年',
        values: [
          { label: '2021年', value: 120, desc: '转型初期', icon: 'lucide/sprout' },
          { label: '2022年', value: 150, desc: '平台优化', icon: 'lucide/zap' },
          { label: '2023年', value: 190, desc: '全面增长' },
        ],
      },
      width: 600,
      height: 400,
    });

    const result = convertSvgToDeck(svg, { extractText: true });
    const svgCount = result.document.content.filter((n) => n.content[0].type === 'svg').length;
    const textCount = result.document.content.filter(
      (n) => n.content[0].type === 'multiBlockContainer',
    ).length;

    // 粗粒度：网格 / 柱组 / 轴线 等少数几块即可
    expect(svgCount).toBeGreaterThanOrEqual(2);
    expect(svgCount).toBeLessThan(20);
    expect(textCount).toBeGreaterThan(3);
    expect(result.stats.textNodeCount).toBe(textCount);
  }, 30000);
});
