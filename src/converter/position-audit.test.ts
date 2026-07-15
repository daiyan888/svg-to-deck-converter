import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from '@antv/infographic/ssr';
import { convertSvgToDeck } from './svg-to-deck.js';
import { finalizeSizedConvertResult } from './scale-deck.js';
import { parseViewBox } from './transform-utils.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

const SYNTAX_DATA = {
  title: '年度营收增长',
  desc: '展示近三年及本年目标营收对比（单位：亿元）',
  values: [
    { label: '2021年', value: 120, desc: '转型初期，稳步试水', icon: 'lucide/sprout' },
    { label: '2022年', value: 150, desc: '平台优化，效率显著提升', icon: 'lucide/zap' },
    { label: '2023年', value: 190, desc: '深化数智融合，全面增长', icon: 'lucide/brain-circuit' },
    { label: '2024年', value: 240, desc: '拓展生态协同，冲击新高', icon: 'lucide/trophy' },
  ],
};

describe('position audit chart-bar-plain-text', () => {
  it('keeps graphics and text in the same viewBox-relative space', async () => {
    const svg = await renderToString({
      template: 'chart-bar-plain-text',
      data: SYNTAX_DATA,
      theme: 'light',
      themeConfig: { palette: 'antv' },
      width: 960,
      height: 640,
    });

    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('svg')!;
    const vb = parseViewBox(root);
    expect(vb.minX).not.toBe(0); // AntV uses padded viewBox like -20 -20 ...

    const converted = convertSvgToDeck(svg, { extractText: true });
    expect(converted.document.attrs.width).toBe(vb.width);
    expect(converted.document.attrs.height).toBe(vb.height);

    const bars = converted.document.content.filter((n) => {
      const c = n.content[0];
      return c.type === 'svg' && JSON.stringify(c.attrs.commands).includes('"comp":"rect"');
    });
    const labels = converted.document.content.filter((n) => {
      const c = n.content[0];
      if (c.type !== 'multiBlockContainer') return false;
      const t = c.content?.[0]?.content?.[0]?.text ?? '';
      return t === '2021年';
    });

    expect(bars.length).toBeGreaterThanOrEqual(1);
    expect(labels.length).toBe(1);

    const barCy = bars[0].attrs.top + bars[0].attrs.height / 2;
    const labelCy = labels[0].attrs.top + labels[0].attrs.height / 2;
    // 同一坐标系后，年标签应大致落在柱条垂直中心（允许少量字号估算误差）
    expect(Math.abs(barCy - labelCy)).toBeLessThan(8);

    const finalized = finalizeSizedConvertResult(svg, converted, { width: 960, height: 640 });
    expect(finalized.result.document.attrs.width).toBe(960);
    expect(finalized.result.document.attrs.height).toBe(640);

    const fBars = finalized.result.document.content.filter((n) => {
      const c = n.content[0];
      return c.type === 'svg' && JSON.stringify(c.attrs.commands).includes('"comp":"rect"');
    });
    const fLabels = finalized.result.document.content.filter((n) => {
      const c = n.content[0];
      if (c.type !== 'multiBlockContainer') return false;
      return (c.content?.[0]?.content?.[0]?.text ?? '') === '2021年';
    });
    const fBarCy = fBars[0].attrs.top + fBars[0].attrs.height / 2;
    const fLabelCy = fLabels[0].attrs.top + fLabels[0].attrs.height / 2;
    expect(Math.abs(fBarCy - fLabelCy)).toBeLessThan(10);
  }, 30000);
});
