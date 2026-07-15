import {
  svgAttrNameFromCamel,
  toThemeCssValue,
  type CommandsItem,
} from 'svg-to-deck-converter';

/** 可能携带主题色槽的 SVG 属性 */
const COLOR_ATTRS = new Set([
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'color',
]);

const VOID_ELEMENTS = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'stop',
  'use',
  'image',
  'feBlend',
  'feColorMatrix',
  'feComposite',
  'feConvolveMatrix',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]);

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function attrsToString(attrs: Record<string, string | number | boolean>): string {
  return Object.entries(attrs)
    .filter(([key]) => key !== 'key')
    .map(([key, value]) => `${svgAttrNameFromCamel(key)}="${escapeAttr(String(value))}"`)
    .join(' ');
}

function resolveColorAttr(key: string, value: string | number | boolean): string | number | boolean {
  if (typeof value !== 'string' || !COLOR_ATTRS.has(key)) {
    return value;
  }
  return toThemeCssValue(value);
}

function commandAttrs(item: CommandsItem): Record<string, string | number | boolean> {
  const attrs: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(item)) {
    if (key === 'comp' || key === 'children' || key === 'innerHTML') {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attrs[key] = resolveColorAttr(key, value);
    }
  }
  return attrs;
}

export function commandToMarkup(item: CommandsItem): string {
  const { comp, children, innerHTML } = item;
  const attrs = attrsToString(commandAttrs(item));
  const open = attrs ? `<${comp} ${attrs}` : `<${comp}`;

  if (typeof innerHTML === 'string') {
    return `${open}>${innerHTML}</${comp}>`;
  }

  if (!children?.length) {
    return VOID_ELEMENTS.has(comp) ? `${open} />` : `${open}></${comp}>`;
  }

  return `${open}>${children.map(commandToMarkup).join('')}</${comp}>`;
}

export function commandsToInnerMarkup(commands: CommandsItem[]): string {
  return commands.map(commandToMarkup).join('');
}
