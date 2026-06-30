import type { CommandsItem } from '../types/deck';

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
]);

const ATTR_KEBAB_MAP: Record<string, string> = {
  className: 'class',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  strokeOpacity: 'stroke-opacity',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  clipPath: 'clip-path',
  clipRule: 'clip-rule',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  textAnchor: 'text-anchor',
  dominantBaseline: 'dominant-baseline',
  xlinkHref: 'xlink:href',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function toKebabCase(name: string): string {
  if (ATTR_KEBAB_MAP[name]) {
    return ATTR_KEBAB_MAP[name];
  }
  if (!name.includes('-') && /[A-Z]/.test(name)) {
    return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  }
  return name;
}

function propsToAttrString(props: Record<string, string | number | boolean>): string {
  return Object.entries(props)
    .filter(([key]) => key !== 'key')
    .map(([key, value]) => `${toKebabCase(key)}="${escapeAttr(String(value))}"`)
    .join(' ');
}

export function commandToMarkup(item: CommandsItem): string {
  const { comp, props, children } = item;
  const attrs = propsToAttrString(props);
  const open = attrs ? `<${comp} ${attrs}` : `<${comp}`;

  if (!children?.length) {
    return VOID_ELEMENTS.has(comp) ? `${open} />` : `${open}></${comp}>`;
  }

  return `${open}>${children.map(commandToMarkup).join('')}</${comp}>`;
}

export function commandsToInnerMarkup(commands: CommandsItem[]): string {
  return commands.map(commandToMarkup).join('');
}
