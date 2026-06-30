import { parseStyleValue } from './transform-utils.js';

export interface ParsedTextColor {
  color?: string;
  textGradientColor?: string;
}

const SKIP_FILL_VALUES = new Set(['none', 'transparent', 'currentcolor']);

function extractGradientFunction(value: string): string | null {
  const start = value.search(/(?:linear|radial)-gradient\s*\(/i);
  if (start < 0) {
    return null;
  }
  const openIdx = value.indexOf('(', start);
  let depth = 0;
  for (let i = openIdx; i < value.length; i += 1) {
    if (value[i] === '(') {
      depth += 1;
    } else if (value[i] === ')') {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseGradientCoord(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    return trimmed;
  }
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) {
    return fallback;
  }
  if (num <= 1 && !trimmed.includes('%')) {
    return `${num * 100}%`;
  }
  return `${num}%`;
}

function normalizeStopOffset(offset: string | null, index: number, total: number): string {
  if (!offset) {
    if (total <= 1) {
      return '0%';
    }
    return `${(index / (total - 1)) * 100}%`;
  }
  const trimmed = offset.trim();
  if (trimmed.endsWith('%')) {
    return trimmed;
  }
  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) {
    return '0%';
  }
  if (num <= 1) {
    return `${num * 100}%`;
  }
  return `${num}%`;
}

function getStopColor(stop: Element): string {
  const styleColor = (stop as SVGStopElement).style?.getPropertyValue('stop-color');
  return stop.getAttribute('stop-color') ?? styleColor ?? '#000000';
}

function linearGradientDirection(x1: string, y1: string, x2: string, y2: string): string {
  const px1 = parseFloat(x1);
  const py1 = parseFloat(y1);
  const px2 = parseFloat(x2);
  const py2 = parseFloat(y2);

  if (Math.abs(py1 - py2) < 0.001) {
    return px2 >= px1 ? 'to right' : 'to left';
  }
  if (Math.abs(px1 - px2) < 0.001) {
    return py2 >= py1 ? 'to bottom' : 'to top';
  }

  const angle = (Math.atan2(px2 - px1, py1 - py2) * 180) / Math.PI;
  return `${Math.round(angle)}deg`;
}

function svgLinearGradientToCss(el: Element): string | null {
  const stops = Array.from(el.querySelectorAll('stop'));
  if (stops.length === 0) {
    return null;
  }

  const stopParts = stops.map((stop, index) => {
    const offset = normalizeStopOffset(stop.getAttribute('offset'), index, stops.length);
    return `${getStopColor(stop)} ${offset}`;
  });

  const x1 = parseGradientCoord(el.getAttribute('x1'), '0%');
  const y1 = parseGradientCoord(el.getAttribute('y1'), '0%');
  const x2 = parseGradientCoord(el.getAttribute('x2'), '100%');
  const y2 = parseGradientCoord(el.getAttribute('y2'), '0%');
  const direction = linearGradientDirection(x1, y1, x2, y2);

  return `linear-gradient(${direction}, ${stopParts.join(', ')})`;
}

function svgRadialGradientToCss(el: Element): string | null {
  const stops = Array.from(el.querySelectorAll('stop'));
  if (stops.length === 0) {
    return null;
  }

  const stopParts = stops.map((stop, index) => {
    const offset = normalizeStopOffset(stop.getAttribute('offset'), index, stops.length);
    return `${getStopColor(stop)} ${offset}`;
  });

  const cx = parseGradientCoord(el.getAttribute('cx'), '50%');
  const cy = parseGradientCoord(el.getAttribute('cy'), '50%');
  const r = parseGradientCoord(el.getAttribute('r'), '50%');

  return `radial-gradient(circle ${r} at ${cx} ${cy}, ${stopParts.join(', ')})`;
}

function resolveSvgGradientUrl(fill: string, svgRoot: SVGSVGElement): string | null {
  const match = fill.match(/^url\(\s*#([^)]+)\s*\)$/i);
  if (!match) {
    return null;
  }

  const gradientEl =
    svgRoot.querySelector(`#${CSS.escape(match[1])}`) ??
    svgRoot.ownerDocument?.getElementById(match[1]);
  if (!gradientEl) {
    return null;
  }

  const tag = gradientEl.tagName.toLowerCase();
  if (tag === 'lineargradient') {
    return svgLinearGradientToCss(gradientEl);
  }
  if (tag === 'radialgradient') {
    return svgRadialGradientToCss(gradientEl);
  }
  return null;
}

function isSolidColor(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || SKIP_FILL_VALUES.has(normalized)) {
    return false;
  }
  return !normalized.startsWith('url(');
}

function parseCssGradientText(style: string): string | undefined {
  const clip =
    parseStyleValue(style, '-webkit-background-clip') ?? parseStyleValue(style, 'background-clip');
  if (clip?.toLowerCase() !== 'text') {
    return undefined;
  }

  const background =
    parseStyleValue(style, 'background-image') ?? parseStyleValue(style, 'background');
  if (!background) {
    return undefined;
  }

  return extractGradientFunction(background) ?? undefined;
}

function parseSolidColorFromStyle(style: string): string | undefined {
  const color = parseStyleValue(style, 'color');
  if (!color || color.toLowerCase() === 'transparent') {
    return undefined;
  }
  return color;
}

export function parseTextColorFromStyle(style: string): ParsedTextColor {
  const textGradientColor = parseCssGradientText(style);
  if (textGradientColor) {
    return { textGradientColor };
  }

  const color = parseSolidColorFromStyle(style);
  return color ? { color } : {};
}

export function parseTextColorFromFill(
  fill: string | undefined,
  svgRoot: SVGSVGElement,
): ParsedTextColor {
  if (!fill) {
    return {};
  }

  const trimmed = fill.trim();
  if (trimmed.toLowerCase().startsWith('url(')) {
    const textGradientColor = resolveSvgGradientUrl(trimmed, svgRoot);
    return textGradientColor ? { textGradientColor } : {};
  }

  if (isSolidColor(trimmed)) {
    return { color: trimmed };
  }

  return {};
}

export function parseTextColor(
  options: {
    fill?: string;
    style?: string;
    svgRoot?: SVGSVGElement;
  },
): ParsedTextColor {
  if (options.style) {
    const fromStyle = parseTextColorFromStyle(options.style);
    if (fromStyle.color || fromStyle.textGradientColor) {
      return fromStyle;
    }
  }

  if (options.fill && options.svgRoot) {
    return parseTextColorFromFill(options.fill, options.svgRoot);
  }

  if (options.fill && isSolidColor(options.fill)) {
    return { color: options.fill.trim() };
  }

  return {};
}
