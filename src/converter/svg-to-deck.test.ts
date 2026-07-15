import { Window } from 'happy-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { convertSvgToDeck } from './svg-to-deck.js';
import type { CommandsItem, SvgNode } from '../types/deck.js';

beforeAll(() => {
  const window = new Window();
  globalThis.window = window as unknown as Window & typeof globalThis.window;
  globalThis.document = window.document;
  globalThis.DOMParser = window.DOMParser;
  globalThis.Node = window.Node;
  globalThis.XMLSerializer = window.XMLSerializer;
});

function svgNodes(result: ReturnType<typeof convertSvgToDeck>): SvgNode[] {
  return result.document.content
    .map((n) => n.content[0])
    .filter((c): c is SvgNode => c.type === 'svg');
}

function findComp(commands: CommandsItem[], comp: string): CommandsItem | undefined {
  for (const cmd of commands) {
    if (cmd.comp === comp) return cmd;
    if (cmd.children) {
      const found = findComp(cmd.children, comp);
      if (found) return found;
    }
  }
  return undefined;
}

describe('convertSvgToDeck block split', () => {
  it('splits sibling shapes into multiple svg deckNodes', () => {
    // 顶层兄弟叶子仍会各成一块；同父 g 下的多 rect 则整组保留（见下一条）
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <rect x="10" y="10" width="40" height="30" fill="#1783FF"/>
      <rect x="80" y="20" width="50" height="40" fill="#00C9C9"/>
      <text x="100" y="90" fill="#333" font-size="12">label</text>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: true });
    const svgs = svgNodes(result);
    const texts = result.document.content.filter((n) => n.content[0].type === 'multiBlockContainer');

    expect(svgs.length).toBe(2);
    expect(texts.length).toBe(1);
    expect(result.document.content[0].attrs.width).toBeGreaterThan(0);
    expect(result.document.content[1].attrs.left).not.toBe(result.document.content[0].attrs.left);
  });

  it('keeps sibling leaf shapes under one g as a single svg block', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <g id="infographic-container">
        <g>
          <rect x="10" y="10" width="40" height="30" fill="#1783FF"/>
          <rect x="10" y="50" width="60" height="30" fill="#00C9C9"/>
          <rect x="10" y="90" width="80" height="30" fill="#F0884D"/>
        </g>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(1);
    const cmds = JSON.stringify(svgs[0].attrs.commands);
    expect(cmds).toContain('#1783FF');
    expect(cmds).toContain('#00C9C9');
    expect(cmds).toContain('#F0884D');
  });

  it('copies referenced defs into each block with rewritten ids', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1783FF"/>
          <stop offset="100%" stop-color="#74b5ff"/>
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.15"/>
        </filter>
      </defs>
      <rect x="10" y="10" width="30" height="30" fill="url(#g1)" filter="url(#shadow)"/>
      <rect x="50" y="10" width="30" height="30" fill="url(#g1)"/>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(2);

    const firstCmds = svgs[0].attrs.commands;
    const defs = firstCmds.find((c) => c.comp === 'defs');
    expect(defs).toBeTruthy();
    expect(defs?.children?.some((c) => c.comp === 'linearGradient')).toBe(true);
    expect(defs?.children?.some((c) => c.comp === 'filter')).toBe(true);

    const grad = defs?.children?.find((c) => c.comp === 'linearGradient');
    expect(String(grad?.id)).toMatch(/^dn0_/);

    const rect = findComp(firstCmds, 'rect');
    expect(String(rect?.fill)).toMatch(/^url\(#dn0_/);
    expect(String(rect?.filter)).toMatch(/^url\(#dn0_/);

    // 第二块也应有自己的前缀，且不共享原始 id
    const defs2 = svgs[1].attrs.commands.find((c) => c.comp === 'defs');
    const grad2 = defs2?.children?.find((c) => c.comp === 'linearGradient');
    expect(String(grad2?.id)).toMatch(/^dn1_/);
    expect(defs2?.children?.some((c) => c.comp === 'filter')).toBe(false);
  });

  it('splits item groups under a container while keeping ancestor transforms', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <g id="infographic-container">
        <g transform="translate(0, 40)">
          <g transform="translate(10, 0)"><rect x="0" y="0" width="40" height="20" fill="red"/></g>
          <g transform="translate(80, 0)"><rect x="0" y="0" width="40" height="20" fill="blue"/></g>
        </g>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const nodes = result.document.content;
    expect(nodes.length).toBe(2);

    // 第一块大约在 left≈10, top≈40（viewBox 原点为 0,0）
    expect(nodes[0].attrs.left).toBeCloseTo(10, 0);
    expect(nodes[0].attrs.top).toBeCloseTo(40, 0);
    expect(nodes[1].attrs.left).toBeCloseTo(80, 0);
    expect(nodes[1].attrs.top).toBeCloseTo(40, 0);
    expect(result.document.attrs.width).toBe(400);
    expect(result.document.attrs.height).toBe(200);

    const cmds0 = (nodes[0].content[0] as SvgNode).attrs.commands;
    // 应带有祖先 translate(0,40)
    const hasAncestor = JSON.stringify(cmds0).includes('translate(0, 40)');
    expect(hasAncestor).toBe(true);
  });

  it('interleaves svg and text by source SVG document order', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
      <g id="infographic-container">
        <rect id="back" x="0" y="0" width="200" height="120" fill="#eee"/>
        <text x="10" y="20" font-size="12">early-text</text>
        <rect id="mid" x="20" y="40" width="80" height="30" fill="#1783FF"/>
        <rect id="front" x="60" y="50" width="80" height="30" fill="#00C9C9"/>
        <text x="100" y="100" font-size="12">late-text</text>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: true });
    const labels = result.document.content.map((n) => {
      const child = n.content[0];
      if (child.type === 'multiBlockContainer') {
        return child.content[0]?.content[0]?.text ?? '';
      }
      const cmds = JSON.stringify(child.attrs.commands);
      if (cmds.includes('#eee')) return 'back';
      if (cmds.includes('#1783FF')) return 'mid';
      if (cmds.includes('#00C9C9')) return 'front';
      return 'svg';
    });
    expect(labels).toEqual(['back', 'early-text', 'mid', 'front', 'late-text']);
  });
});
