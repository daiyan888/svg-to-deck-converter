import { collectElementProps, parseFontSize } from './attribute-utils.js';
import { parseTextColor } from './color-utils.js';
import {
  getAbsoluteAnchor,
  parseStyleValue,
  type ViewBoxInfo,
} from './transform-utils.js';
import { isTextElement } from './svg-tags.js';
import type { MultiBlockContainNode, TextGradientColorMark, TextMark, TextNode } from '../types/deck.js';

export interface TextExtractContext {
  textNodeCount: number;
}

export interface TextDeckNodeCandidate {
  left: number;
  top: number;
  width: number;
  height: number;
  multiBlockContain: MultiBlockContainNode;
}

function getDirectText(el: Element): string {
  let text = '';
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    }
  }
  return text.trim();
}

function parseNumAttr(el: Element, name: string): number | undefined {
  const raw = el.getAttribute(name);
  if (!raw) {
    return undefined;
  }
  const n = parseFloat(raw);
  return Number.isNaN(n) ? undefined : n;
}

function findSizeHint(el: Element): { width?: number; height?: number } {
  const width = parseNumAttr(el, 'width') ?? parseNumAttr(el, 'data-width');
  const height = parseNumAttr(el, 'height') ?? parseNumAttr(el, 'data-height');
  const parent = el.parentElement;
  if (parent?.tagName.toLowerCase() === 'g') {
    return {
      width: width ?? parseNumAttr(parent, 'width'),
      height: height ?? parseNumAttr(parent, 'height'),
    };
  }
  return { width, height };
}

function estimateTextBounds(text: string, fontSize: number): { width: number; height: number } {
  return {
    width: Math.max(Math.ceil(text.length * fontSize * 0.65), fontSize),
    height: Math.ceil(fontSize * 1.2),
  };
}

function adjustTextBox(
  anchorX: number,
  anchorY: number,
  width: number,
  height: number,
  textAnchor: string | undefined,
  dominantBaseline: string | undefined,
): { left: number; top: number } {
  let left = anchorX;
  let top = anchorY;

  if (textAnchor === 'middle') {
    left = anchorX - width / 2;
  } else if (textAnchor === 'end') {
    left = anchorX - width;
  }

  if (dominantBaseline === 'central' || dominantBaseline === 'middle') {
    top = anchorY - height / 2;
  } else if (dominantBaseline === 'hanging' || dominantBaseline === 'text-before-edge') {
    top = anchorY;
  } else {
    top = anchorY - height * 0.85;
  }

  return { left, top };
}

function parseHorizontalAlign(
  el: Element,
  spanStyle: string,
): 'left' | 'center' | 'right' | undefined {
  const dataAlign = el.getAttribute('data-horizontal-align')?.toLowerCase();
  if (dataAlign === 'right') {
    return 'right';
  }
  if (dataAlign === 'center' || dataAlign === 'middle') {
    return 'center';
  }
  if (dataAlign === 'left') {
    return 'left';
  }

  const styleAlign = parseStyleValue(spanStyle, 'text-align');
  if (styleAlign === 'right') {
    return 'right';
  }
  if (styleAlign === 'center') {
    return 'center';
  }
  if (styleAlign === 'left') {
    return 'left';
  }
  return undefined;
}

function buildTextGradientColorMark(
  color: string | undefined,
  textGradientColor: string | undefined,
): TextGradientColorMark | null {
  if (!color && !textGradientColor) {
    return null;
  }
  return {
    type: 'textGradientColor',
    attrs: {
      color: color ?? null,
      textGradientColor: textGradientColor ?? null,
    },
  };
}

function buildMultiBlockContain(
  text: string,
  fontFamily: string,
  fontSize: number,
  textAlign?: 'left' | 'center' | 'right',
  color?: string,
  textGradientColor?: string,
): MultiBlockContainNode {
  const marks: TextMark[] = [
    {
      type: 'textStyle',
      attrs: { fontFamily, fontSize },
    },
  ];
  const colorMark = buildTextGradientColorMark(color, textGradientColor);
  if (colorMark) {
    marks.push(colorMark);
  }
  const textNode: TextNode = {
    type: 'text',
    text,
    marks,
  };
  return {
    type: 'multiBlockContain',
    content: [
      {
        type: 'paragraph',
        ...(textAlign ? { attrs: { textAlign } } : {}),
        content: [textNode],
      },
    ],
  };
}

function toDeckCoords(
  x: number,
  y: number,
  viewBox: ViewBoxInfo,
): { left: number; top: number } {
  return {
    left: x - viewBox.minX,
    top: y - viewBox.minY,
  };
}

function textElementToCandidate(
  el: Element,
  defaultFontFamily: string,
  defaultFontSize: number,
  viewBox: ViewBoxInfo,
  svgRoot: SVGSVGElement,
): TextDeckNodeCandidate | null {
  const content = getDirectText(el);
  if (!content) {
    return null;
  }

  const props = collectElementProps(el);
  const fontFamily =
    typeof props.fontFamily === 'string' ? props.fontFamily : defaultFontFamily;
  const fontSize = parseFontSize(
    typeof props.fontSize === 'string' || typeof props.fontSize === 'number'
      ? props.fontSize
      : undefined,
    defaultFontSize,
  );

  const sizeHint = findSizeHint(el);
  const { width, height } =
    sizeHint.width && sizeHint.height
      ? { width: sizeHint.width, height: sizeHint.height }
      : estimateTextBounds(content, fontSize);

  const anchor = getAbsoluteAnchor(el);
  const textAnchor = typeof props.textAnchor === 'string' ? props.textAnchor : undefined;
  const dominantBaseline =
    typeof props.dominantBaseline === 'string' ? props.dominantBaseline : undefined;
  const box = adjustTextBox(anchor.x, anchor.y, width, height, textAnchor, dominantBaseline);
  const { left, top } = toDeckCoords(box.left, box.top, viewBox);
  const fill = typeof props.fill === 'string' ? props.fill : undefined;
  const { color, textGradientColor } = parseTextColor({ fill, svgRoot });

  return {
    left,
    top,
    width,
    height,
    multiBlockContain: buildMultiBlockContain(
      content,
      fontFamily,
      fontSize,
      undefined,
      color,
      textGradientColor,
    ),
  };
}

function foreignObjectToCandidate(
  el: Element,
  defaultFontFamily: string,
  defaultFontSize: number,
  viewBox: ViewBoxInfo,
  svgRoot: SVGSVGElement,
): TextDeckNodeCandidate | null {
  const span = el.querySelector('span');
  const content = (span?.textContent ?? el.textContent ?? '').trim();
  if (!content) {
    return null;
  }

  const style = span?.getAttribute('style') ?? '';
  const fontSize = parseFontSize(parseStyleValue(style, 'font-size'), defaultFontSize);
  const fontFamily = parseStyleValue(style, 'font-family') ?? defaultFontFamily;
  const textAlign = parseHorizontalAlign(el, style);

  const width = parseNumAttr(el, 'width') ?? estimateTextBounds(content, fontSize).width;
  const height = parseNumAttr(el, 'height') ?? estimateTextBounds(content, fontSize).height;

  const anchor = getAbsoluteAnchor(el);
  const { left, top } = toDeckCoords(anchor.x, anchor.y, viewBox);
  const { color, textGradientColor } = parseTextColor({ style, svgRoot });

  return {
    left,
    top,
    width,
    height,
    multiBlockContain: buildMultiBlockContain(
      content,
      fontFamily,
      fontSize,
      textAlign,
      color,
      textGradientColor,
    ),
  };
}

function walkTextElements(
  el: Element,
  candidates: TextDeckNodeCandidate[],
  defaultFontFamily: string,
  defaultFontSize: number,
  viewBox: ViewBoxInfo,
  svgRoot: SVGSVGElement,
  ctx: TextExtractContext,
): void {
  const tag = el.tagName.toLowerCase();

  if (tag === 'foreignobject') {
    const candidate = foreignObjectToCandidate(
      el,
      defaultFontFamily,
      defaultFontSize,
      viewBox,
      svgRoot,
    );
    if (candidate) {
      candidates.push(candidate);
      ctx.textNodeCount += 1;
    }
    return;
  }

  if (isTextElement(el.tagName)) {
    const candidate = textElementToCandidate(
      el,
      defaultFontFamily,
      defaultFontSize,
      viewBox,
      svgRoot,
    );
    if (candidate) {
      candidates.push(candidate);
      ctx.textNodeCount += 1;
    }
    return;
  }

  for (const child of Array.from(el.children)) {
    walkTextElements(child, candidates, defaultFontFamily, defaultFontSize, viewBox, svgRoot, ctx);
  }
}

export function extractTextDeckNodes(
  svgRoot: SVGSVGElement,
  viewBox: ViewBoxInfo,
  defaultFontFamily: string,
  defaultFontSize: number,
  ctx: TextExtractContext,
): TextDeckNodeCandidate[] {
  const candidates: TextDeckNodeCandidate[] = [];
  walkTextElements(svgRoot, candidates, defaultFontFamily, defaultFontSize, viewBox, svgRoot, ctx);
  return candidates;
}

/** @deprecated 使用 extractTextDeckNodes */
export function extractTextBlocks(
  svgRoot: SVGSVGElement,
  defaultFontFamily: string,
  defaultFontSize: number,
  ctx: TextExtractContext,
): MultiBlockContainNode[] {
  const viewBox = {
    minX: 0,
    minY: 0,
    width: 800,
    height: 600,
    viewBox: '0 0 800 600',
  };
  return extractTextDeckNodes(svgRoot, viewBox, defaultFontFamily, defaultFontSize, ctx).map(
    (c) => c.multiBlockContain,
  );
}
