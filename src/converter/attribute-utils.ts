/** 将 SVG 属性名转为 React camelCase */
const ATTR_CAMEL_MAP: Record<string, string> = {
  'accent-height': 'accentHeight',
  'alignment-baseline': 'alignmentBaseline',
  'arabic-form': 'arabicForm',
  'baseline-shift': 'baselineShift',
  'cap-height': 'capHeight',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'line-height': 'lineHeight',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'panose-1': 'panose1',
  'pointer-events': 'pointerEvents',
  'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'transform-origin': 'transformOrigin',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'xlink:href': 'xlinkHref',
  href: 'href',
  class: 'className',
};

function toCamelCase(name: string): string {
  if (ATTR_CAMEL_MAP[name]) {
    return ATTR_CAMEL_MAP[name];
  }
  if (!name.includes('-')) {
    return name;
  }
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function parseAttrValue(raw: string): string | number | boolean {
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  const num = Number(raw);
  if (raw.trim() !== '' && !Number.isNaN(num) && /^-?\d/.test(raw.trim())) {
    return num;
  }
  return raw;
}

export function collectElementProps(el: Element): Record<string, string | number | boolean> {
  const props: Record<string, string | number | boolean> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'style') {
      continue;
    }
    props[toCamelCase(attr.name)] = parseAttrValue(attr.value);
  }
  const style = (el as SVGElement).style;
  if (style && style.cssText) {
    const styleParts = style.cssText.split(';');
    for (const part of styleParts) {
      const colon = part.indexOf(':');
      if (colon <= 0) {
        continue;
      }
      const key = part.slice(0, colon).trim();
      const value = part.slice(colon + 1).trim();
      if (key) {
        props[toCamelCase(key)] = parseAttrValue(value);
      }
    }
  }
  return props;
}

export function parseSvgLength(value: string | null | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    return fallback;
  }
  return num;
}

export function formatFontSizePx(value: number): string {
  return `${value}px`;
}

/** CSS px → pt（96dpi → 72dpi）：pt = px * 72 / 96 */
export function pxToPt(px: number): number {
  return (px * 72) / 96;
}

/** 将像素字号格式化为 pt 字符串，供 multiBlockContainer textStyle 使用 */
export function formatFontSizePt(px: number): string {
  return `${pxToPt(px)}pt`;
}

export function parseFontSize(value: string | number | undefined, fallback: number): number {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return fallback;
  }
  const num = parseFloat(String(value));
  return Number.isNaN(num) ? fallback : num;
}

/**
 * 将 CSS/SVG line-height 解析为相对字号的无单位倍数。
 * 无法解析（含 normal）时返回 undefined。
 */
export function parseCssLineHeight(
  value: string | number | undefined,
  fontSizePx: number,
): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const raw = String(value).trim().toLowerCase();
  if (!raw || raw === 'normal' || raw === 'inherit' || raw === 'unset') {
    return undefined;
  }

  if (raw.endsWith('%')) {
    const n = parseFloat(raw);
    return Number.isNaN(n) ? undefined : n / 100;
  }

  const n = parseFloat(raw);
  if (Number.isNaN(n)) {
    return undefined;
  }

  if (raw.endsWith('pt')) {
    if (fontSizePx <= 0) {
      return undefined;
    }
    return (n * 96) / 72 / fontSizePx;
  }

  if (raw.endsWith('px')) {
    if (fontSizePx <= 0) {
      return undefined;
    }
    return n / fontSizePx;
  }

  if (raw.endsWith('em') || raw.endsWith('rem')) {
    return n;
  }

  // 无单位倍数
  return n;
}
