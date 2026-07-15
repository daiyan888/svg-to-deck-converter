import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from '@antv/infographic/ssr';
import { collectGraphicBlocks } from './svg-split-blocks.js';
import { bboxHeight, bboxWidth, estimatePathBBox, estimateWorldBBox } from './svg-bbox.js';
import { convertSvgToDeck } from './svg-to-deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

describe('path arc bbox', () => {
  it('includes elliptical arc extrema (not just endpoints)', () => {
    // 半径 100 的四分之一圆：端点 (100,0)->(0,100)，弧凸出含 (100,100) 方向极值
    const box = estimatePathBBox('M100,0 A100,100 0 0 1 0,100');
    expect(box).toBeTruthy();
    expect(box!.maxX).toBeCloseTo(100, 5);
    expect(box!.maxY).toBeCloseTo(100, 5);
    expect(box!.minX).toBeCloseTo(0, 5);
    expect(box!.minY).toBeCloseTo(0, 5);

    // 大半圆：端点 (100,0)->(-100,0) 上弧，必须含 (0,-100)
    const large = estimatePathBBox('M100,0 A100,100 0 1 0 -100,0');
    expect(large!.minY).toBeCloseTo(-100, 5);
    expect(large!.maxX).toBeCloseTo(100, 5);
    expect(large!.minX).toBeCloseTo(-100, 5);
  });

  it('pie slice through positive-x keeps radius in bbox', () => {
    // 复现 AntV 饼图扇区：弧经过 (140,0) 但端点 x 都 < 140
    const d =
      'M121.509,-65.387A2,2,0,0,1,124.232,-64.548A140,140,0,0,1,93.63,104.084A2,2,0,0,1,90.786,103.913L0,0Z';
    const box = estimatePathBBox(d)!;
    expect(box.maxX).toBeGreaterThan(135);
    expect(bboxWidth(box)).toBeGreaterThan(135);
  });
});

describe('chart-pie-compact-card conversion', () => {
  it('keeps pie disk roughly circular (no arc clipping)', async () => {
    const svg = await renderToString({
      template: 'chart-pie-compact-card',
      data: {
        title: '年度营收增长',
        desc: '展示近三年及本年目标营收对比（单位：亿元）',
        values: [
          { label: '2021年', value: 120, desc: '转型初期，稳步试水', icon: 'lucide/sprout' },
          { label: '2022年', value: 150, desc: '平台优化，效率显著提升', icon: 'lucide/zap' },
          { label: '2023年', value: 190, desc: '深化数智融合，全面增长', icon: 'lucide/brain-circuit' },
          { label: '2024年', value: 240, desc: '拓展生态协同，冲击新高', icon: 'lucide/trophy' },
        ],
      },
      theme: 'light',
      themeConfig: { palette: 'antv' },
      width: 960,
      height: 640,
    });

    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('svg')!;
    const blocks = collectGraphicBlocks(root, true);
    const pieBlock = blocks.find((b) => b.querySelectorAll('path').length >= 4);
    expect(pieBlock).toBeTruthy();

    const world = estimateWorldBBox(pieBlock!, true)!;
    // 半径约 140 → 直径约 280；旧逻辑只有 ~245 会裁切扇区
    expect(bboxWidth(world)).toBeGreaterThan(270);
    expect(bboxHeight(world)).toBeGreaterThan(270);
    expect(Math.abs(bboxWidth(world) - bboxHeight(world))).toBeLessThan(20);

    const deck = convertSvgToDeck(svg, { extractText: true });
    const pieNode = deck.document.content.find((n) => {
      const c = n.content[0];
      if (c?.type !== 'svg') return false;
      const cmds = JSON.stringify(c.attrs.commands);
      return (cmds.match(/"comp":"path"/g) ?? []).length >= 4 && cmds.includes('A140');
    });
    expect(pieNode).toBeTruthy();
    expect(pieNode!.attrs.width).toBeGreaterThan(270);
    expect(pieNode!.attrs.height).toBeGreaterThan(270);
  }, 60000);
});
