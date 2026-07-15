import { describe, expect, it } from 'vitest';
import { svgAttrNameFromCamel } from './attribute-utils.js';
import type { CommandsItem } from '../types/deck.js';

/**
 * Mirror of TipTap markup serialization: presentation attrs kebab-case,
 * SVG/SMIL camelCase attrs preserved via svgAttrNameFromCamel.
 */
function commandToMarkup(item: CommandsItem): string {
  const attrs: string[] = [];
  for (const [key, value] of Object.entries(item)) {
    if (key === 'comp' || key === 'children' || key === 'innerHTML' || key === 'key') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attrs.push(`${svgAttrNameFromCamel(key)}="${String(value)}"`);
    }
  }
  const open = attrs.length ? `<${item.comp} ${attrs.join(' ')}` : `<${item.comp}`;
  if (typeof item.innerHTML === 'string') {
    return `${open}>${item.innerHTML}</${item.comp}>`;
  }
  if (!item.children?.length) {
    return `${open} />`;
  }
  return `${open}>${item.children.map(commandToMarkup).join('')}</${item.comp}>`;
}

describe('SVG attr markup serialization', () => {
  it('preserves maskUnits, gradientUnits, attributeName, repeatCount', () => {
    const commands: CommandsItem[] = [
      {
        comp: 'defs',
        children: [
          {
            comp: 'mask',
            id: 'm1',
            maskUnits: 'userSpaceOnUse',
            x: 0,
            y: 0,
            width: 10,
            height: 100,
            children: [{ comp: 'rect', width: 10, height: 100, fill: 'white' }],
          },
          {
            comp: 'linearGradient',
            id: 'g1',
            gradientUnits: 'userSpaceOnUse',
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            children: [
              { comp: 'stop', offset: '0%', stopColor: '#00f' },
              { comp: 'stop', offset: '100%', stopColor: '#0ff' },
            ],
          },
        ],
      },
      {
        comp: 'path',
        d: 'M0 0 L0 100',
        stroke: '#333',
        strokeDasharray: '5,5',
        strokeWidth: 2,
        mask: 'url(#m1)',
      },
      {
        comp: 'path',
        d: 'M0 50 L100 50',
        stroke: 'url(#g1)',
        strokeDasharray: '8,8',
        strokeWidth: 2,
        children: [
          {
            comp: 'animate',
            attributeName: 'stroke-dashoffset',
            from: '0',
            to: '16',
            dur: '1s',
            repeatCount: 'indefinite',
          },
        ],
      },
    ];

    const markup = commands.map(commandToMarkup).join('');

    expect(markup).toContain('maskUnits="userSpaceOnUse"');
    expect(markup).toContain('gradientUnits="userSpaceOnUse"');
    expect(markup).toContain('attributeName="stroke-dashoffset"');
    expect(markup).toContain('repeatCount="indefinite"');
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain('stroke-dasharray="5,5"');
    expect(markup).toContain('stop-color="#00f"');

    expect(markup).not.toContain('mask-units=');
    expect(markup).not.toContain('gradient-units=');
    expect(markup).not.toContain('attribute-name=');
    expect(markup).not.toContain('repeat-count=');
  });
});
