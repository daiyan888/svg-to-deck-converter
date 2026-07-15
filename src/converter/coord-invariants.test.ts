import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { convertSvgToDeck } from './svg-to-deck.js';
import { finalizeSizedConvertResult } from './scale-deck.js';
import type { DeckNode, SvgNode } from '../types/deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

function isSvg(n: DeckNode): n is DeckNode & { content: [SvgNode] } {
  return n.content[0]?.type === 'svg';
}

function textOf(n: DeckNode): string {
  const c = n.content[0];
  if (c?.type !== 'multiBlockContainer') return '';
  return c.content?.[0]?.content?.[0]?.text ?? '';
}

/** 模拟 AntV 常见结构：非零 viewBox 原点 + 分组 transform + foreignObject / text */
function antvLikeSvg(viewBox: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="400" height="300">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1783FF"/>
      <stop offset="100%" stop-color="#74b5ff"/>
    </linearGradient>
  </defs>
  <g id="infographic-container">
    <g transform="translate(0, 40)">
      <g transform="translate(20, 0)">
        <foreignObject x="0" y="0" width="80" height="24"><span>ItemA</span></foreignObject>
      </g>
      <g transform="translate(20, 40)">
        <foreignObject x="0" y="0" width="80" height="24"><span>ItemB</span></foreignObject>
      </g>
      <rect x="120" y="0" width="100" height="24" fill="url(#g1)"/>
      <rect x="120" y="40" width="160" height="24" fill="#00C9C9"/>
      <text x="230" y="12" font-size="14" dominant-baseline="central">10</text>
      <text x="290" y="52" font-size="14" dominant-baseline="central">20</text>
    </g>
  </g>
</svg>`;
}

describe('cross-template coordinate invariants (synthetic AntV-like SVG)', () => {
  it.each([
    ['0 0 400 300', 0, 0],
    ['-20 -20 400 300', -20, -20],
    ['10 30 400 300', 10, 30],
  ] as const)('viewBox %s keeps graphics/text aligned', (vb, minX, minY) => {
    const result = convertSvgToDeck(antvLikeSvg(vb), { extractText: true });
    expect(result.document.attrs.width).toBe(400);
    expect(result.document.attrs.height).toBe(300);

    const rects = result.document.content.filter(
      (n) => isSvg(n) && JSON.stringify(n.content[0].attrs.commands).includes('"comp":"rect"'),
    );
    const labelA = result.document.content.find((n) => textOf(n) === 'ItemA');
    expect(rects.length).toBe(2);
    expect(labelA).toBeTruthy();

    // ItemA FO world y = 40+0 = 40；相对 viewBox → top = 40 - minY
    expect(labelA!.attrs.top).toBeCloseTo(40 - minY, 5);
    expect(labelA!.attrs.left).toBeCloseTo(20 - minX, 5);

    // 第一根柱 world y=40；相对 viewBox 后应与 ItemA 顶对齐
    expect(rects[0].attrs.top).toBeCloseTo(40 - minY, 5);
    expect(rects[0].attrs.left).toBeCloseTo(120 - minX, 5);

    // defs 引用已拷贝
    const cmds = JSON.stringify(rects[0].content[0].attrs.commands);
    expect(cmds).toContain('defs');
    expect(cmds).toMatch(/url\(#dn0_/);
  });

  it('page width/height meet-scale preserves relative alignment', () => {
    const svg = antvLikeSvg('-20 -16 480 320');
    const converted = convertSvgToDeck(svg, { extractText: true });
    const finalized = finalizeSizedConvertResult(svg, converted, { width: 960, height: 640 });

    expect(finalized.result.document.attrs.width).toBe(960);
    expect(finalized.result.document.attrs.height).toBe(640);

    const rects = finalized.result.document.content.filter(
      (n) => isSvg(n) && JSON.stringify(n.content[0].attrs.commands).includes('"comp":"rect"'),
    );
    const labelA = finalized.result.document.content.find((n) => textOf(n) === 'ItemA');
    expect(Math.abs(rects[0].attrs.top - labelA!.attrs.top)).toBeLessThan(1);
  });

  it('page offsetTop/offsetLeft shift content and grow canvas', () => {
    const svg = antvLikeSvg('-20 -20 400 300');
    const converted = convertSvgToDeck(svg, { extractText: true });
    const finalized = finalizeSizedConvertResult(
      svg,
      converted,
      { width: 800, height: 600 },
      { offsetTop: 50, offsetLeft: 80 },
    );

    expect(finalized.result.document.attrs.width).toBe(880);
    expect(finalized.result.document.attrs.height).toBe(650);

    const bare = finalizeSizedConvertResult(svg, converted, { width: 800, height: 600 });
    const a = finalized.result.document.content[0];
    const b = bare.result.document.content[0];
    expect(a.attrs.left).toBeCloseTo(b.attrs.left + 80, 5);
    expect(a.attrs.top).toBeCloseTo(b.attrs.top + 50, 5);
  });
});
