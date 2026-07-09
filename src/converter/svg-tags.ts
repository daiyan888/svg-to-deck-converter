/** 用户定义的 comp 白名单；不在列表中的叶子节点默认 path，有子节点默认 g */
export const KNOWN_COMPS = new Set([
  'g',
  'animate',
  'ellipse',
  'circle',
  'polygon',
  'rect',
  'path',
  'linearGradient',
  'stop',
]);

/** 额外支持的 SVG 标签（保持原标签名，不强制转 path） */
export const EXTENDED_COMPS = new Set([
  'defs',
  'clipPath',
  'mask',
  'line',
  'polyline',
  'radialGradient',
  'use',
  'image',
  'pattern',
  'symbol',
  'marker',
  'text',
  'tspan',
  'foreignObject',
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
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
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]);

function canonicalComp(tagName: string): string | undefined {
  const lower = tagName.toLowerCase();
  for (const comp of KNOWN_COMPS) {
    if (comp.toLowerCase() === lower) {
      return comp;
    }
  }
  for (const comp of EXTENDED_COMPS) {
    if (comp.toLowerCase() === lower) {
      return comp;
    }
  }
  return undefined;
}

export function resolveComp(tagName: string, hasElementChildren: boolean): string {
  const canonical = canonicalComp(tagName);
  if (canonical) {
    return canonical;
  }
  if (hasElementChildren) {
    return 'g';
  }
  return 'path';
}

export function isTextElement(tagName: string): boolean {
  const tag = tagName.toLowerCase();
  return tag === 'text' || tag === 'tspan';
}

export function isSkippableRoot(tagName: string): boolean {
  const tag = tagName.toLowerCase();
  return tag === 'svg' || tag === 'style' || tag === 'script' || tag === 'title' || tag === 'desc';
}
