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

  it('splits sibling filled rects under one g into one deckNode each', () => {
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
    expect(svgs.length).toBe(3);
    expect(JSON.stringify(svgs[0].attrs.commands)).toContain('#1783FF');
    expect(JSON.stringify(svgs[1].attrs.commands)).toContain('#00C9C9');
    expect(JSON.stringify(svgs[2].attrs.commands)).toContain('#F0884D');
  });

  it('keeps grid stroke paths merged but splits pie leaders one-per-line', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <g id="infographic-container">
        <g id="grid">
          <path d="M10 10 L10 100" stroke="#262626" fill="none"/>
          <path d="M50 10 L50 100" stroke="#262626" fill="none"/>
          <path d="M90 10 L90 100" stroke="#262626" fill="none"/>
        </g>
        <g id="leaders">
          <path d="M100 50 L120 30 L180 30" stroke="#1783FF" fill="none"/>
          <path d="M100 80 L120 100 L180 100" stroke="#00C9C9" fill="none"/>
        </g>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(3);
    const grid = svgs.find((s) => (JSON.stringify(s.attrs.commands).match(/"comp":"path"/g) ?? []).length >= 3);
    expect(grid).toBeTruthy();
    expect(JSON.stringify(svgs.map((s) => s.attrs.commands))).toContain('#1783FF');
    expect(JSON.stringify(svgs.map((s) => s.attrs.commands))).toContain('#00C9C9');
  });

  it('keeps mixed line+area series as one block but splits markers', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
      <g id="infographic-container">
        <g>
          <path d="M10 50 L50 30 L90 40" stroke="#1783FF" fill="none"/>
          <path d="M10 90 L10 50 L50 30 L90 40 L90 90 Z" stroke="none" fill="#1783FF33"/>
        </g>
        <g>
          <ellipse cx="10" cy="50" rx="3" ry="3" fill="#1783FF"/>
          <ellipse cx="50" cy="30" rx="3" ry="3" fill="#00C9C9"/>
        </g>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(3);
    const series = svgs.find((s) => (JSON.stringify(s.attrs.commands).match(/"comp":"path"/g) ?? []).length === 2);
    expect(series).toBeTruthy();
  });

  it('keeps card body + thin accent rect as one block', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <g id="infographic-container">
        <g>
          <rect x="0" y="0" width="200" height="60" fill="#ffffff"/>
          <rect x="197" y="0" width="3" height="60" fill="#1783FF"/>
        </g>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(1);
    const cmds = JSON.stringify(svgs[0].attrs.commands);
    expect(cmds).toContain('#ffffff');
    expect(cmds).toContain('#1783FF');
  });

  it('drops AntV editor chrome btn-add/btn-remove rects', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <g id="infographic-container">
        <rect x="10" y="10" width="40" height="30" fill="#1783FF"/>
        <rect fill="#F9C0C0" fill-opacity="0.3" width="20" height="20" data-indexes="0" data-element-type="btn-remove" x="100" y="100"/>
        <rect fill="#B9EBCA" fill-opacity="0.3" width="20" height="20" data-indexes="1" data-element-type="btn-add" x="200" y="100"/>
      </g>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    expect(svgs.length).toBe(1);
    const cmds = JSON.stringify(svgs.map((s) => s.attrs.commands));
    expect(cmds).toContain('#1783FF');
    expect(cmds).not.toContain('btn-add');
    expect(cmds).not.toContain('btn-remove');
    expect(cmds).not.toContain('#F9C0C0');
    expect(cmds).not.toContain('#B9EBCA');
  });

  it('strips AntV path width/height metadata from commands', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M0,0 L50,0 L50,50 Z" fill="#1783FF" width="280" height="280"/>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    const path = findComp(svgs[0].attrs.commands, 'path');
    expect(path).toBeTruthy();
    expect(path?.width).toBeUndefined();
    expect(path?.height).toBeUndefined();
  });

  it('sanitizes defs ids that contain hash for HTML-embedded svg', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="#1783ff-badge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1783FF"/>
          <stop offset="100%" stop-color="#74b5ff"/>
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="40" rx="16" ry="16" fill="url(##1783ff-badge)"/>
    </svg>`;

    const result = convertSvgToDeck(svg, { extractText: false });
    const svgs = svgNodes(result);
    const cmds = JSON.stringify(svgs[0].attrs.commands);
    expect(cmds).toContain('dn0_1783ff-badge');
    expect(cmds).not.toMatch(/id":"dn0_#/);
    expect(cmds).toContain('url(#dn0_1783ff-badge)');
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
