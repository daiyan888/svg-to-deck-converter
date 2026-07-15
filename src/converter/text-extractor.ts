import {
  collectElementProps,
  formatFontSizePt,
  parseCssLineHeight,
  parseFontSize,
} from './attribute-utils.js';
import { parseTextColor } from './color-utils.js';
import {
  getAbsoluteAnchor,
  parseStyleValue,
  type ViewBoxInfo,
} from './transform-utils.js';
import { isTextElement } from './svg-tags.js';
import {
  DEFAULT_MULTI_BLOCK_CONTAINER_PADDING,
  DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
  DEFAULT_PARAGRAPH_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_TEXT_ALIGN,
  LINE_HEIGHT_RENDER_FACTOR,
  type MultiBlockContainerNode,
  type TextAlign,
  type TextGradientColorMark,
  type TextMark,
  type TextNode,
  type VerticalAlign,
} from '../types/deck.js';

export interface TextExtractContext {
  textNodeCount: number;
}

export interface TextDeckNodeCandidate {
  left: number;
  top: number;
  width: number;
  height: number;
  multiBlockContainer: MultiBlockContainerNode;
  /** 源 text / foreignObject，用于按 SVG 文档序排 deck.content */
  sourceElement: Element;
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

/**
 * AntV FO 宽度余量仅约 1.5%，字体略差或 hinting 不同就会把末字挤到下一行。
 * TipTap 侧再留一点水平余量，并向两侧均分以免破坏居中。
 */
const FOREIGN_OBJECT_WIDTH_SLACK = 1.03;

/** 规范化字体名：去掉首尾引号，JSON 中存裸名（如 Alibaba PuHuiTi）。 */
function normalizeFontFamily(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, '');
}

/**
 * 从元素自身向上解析 font-family（style / 属性），覆盖 AntV 写在 `<svg>` 上、
 * 而 foreignObject 内 span 未显式声明的情况。
 */
function resolveInheritedFontFamily(el: Element, fallback: string): string {
  let node: Element | null = el;
  while (node) {
    const fromStyle = parseStyleValue(node.getAttribute('style') ?? '', 'font-family');
    if (fromStyle) {
      return normalizeFontFamily(fromStyle);
    }
    const fromAttr = node.getAttribute('font-family')?.trim();
    if (fromAttr) {
      return normalizeFontFamily(fromAttr);
    }
    node = node.parentElement;
  }
  return fallback;
}

function applyForeignObjectWidthSlack(
  width: number,
  left: number,
): { width: number; left: number } {
  const next = Math.ceil(width * FOREIGN_OBJECT_WIDTH_SLACK);
  if (next <= width) {
    return { width, left };
  }
  return {
    width: next,
    left: left - (next - width) / 2,
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

function mapToTextAlign(raw: string | undefined | null): TextAlign | undefined {
  if (!raw) {
    return undefined;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'left' || v === 'start') {
    return 'left';
  }
  if (v === 'center' || v === 'middle') {
    return 'center';
  }
  if (v === 'right' || v === 'end') {
    return 'right';
  }
  if (v === 'justify') {
    return 'justify';
  }
  return undefined;
}

function parseHorizontalAlign(
  el: Element,
  spanStyle: string,
  textAnchor?: string,
): TextAlign {
  const fromData = mapToTextAlign(el.getAttribute('data-horizontal-align'));
  if (fromData) {
    return fromData;
  }

  const fromStyle = mapToTextAlign(parseStyleValue(spanStyle, 'text-align'));
  if (fromStyle) {
    return fromStyle;
  }

  const fromAnchor = mapToTextAlign(textAnchor);
  if (fromAnchor) {
    return fromAnchor;
  }

  return DEFAULT_PARAGRAPH_TEXT_ALIGN;
}

function mapToVerticalAlign(raw: string | undefined | null): VerticalAlign | undefined {
  if (!raw) {
    return undefined;
  }
  const v = raw.trim().toLowerCase();
  if (
    v === 'start' ||
    v === 'top' ||
    v === 'flex-start' ||
    v === 'hanging' ||
    v === 'text-before-edge' ||
    v === 'text-top'
  ) {
    return 'start';
  }
  if (v === 'center' || v === 'middle' || v === 'central') {
    return 'center';
  }
  if (
    v === 'end' ||
    v === 'bottom' ||
    v === 'flex-end' ||
    v === 'text-after-edge' ||
    v === 'text-bottom'
  ) {
    return 'end';
  }
  return undefined;
}

function parseVerticalAlign(
  el: Element,
  spanStyle: string,
  dominantBaseline?: string,
): VerticalAlign {
  const fromData = mapToVerticalAlign(el.getAttribute('data-vertical-align'));
  if (fromData) {
    return fromData;
  }

  const fromAlignItems = mapToVerticalAlign(parseStyleValue(spanStyle, 'align-items'));
  if (fromAlignItems) {
    return fromAlignItems;
  }

  const fromVerticalAlign = mapToVerticalAlign(parseStyleValue(spanStyle, 'vertical-align'));
  if (fromVerticalAlign) {
    return fromVerticalAlign;
  }

  const fromBaseline = mapToVerticalAlign(dominantBaseline);
  if (fromBaseline) {
    return fromBaseline;
  }

  return DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN;
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

/**
 * SVG/CSS 行高 → paragraph.lineHeight。
 * 渲染时会再乘 LINE_HEIGHT_RENDER_FACTOR，故此处除以该系数以保持视觉一致。
 */
function toStoredLineHeight(cssLineHeight: number | undefined): number {
  if (cssLineHeight == null || !Number.isFinite(cssLineHeight)) {
    return DEFAULT_PARAGRAPH_LINE_HEIGHT;
  }
  return cssLineHeight / LINE_HEIGHT_RENDER_FACTOR;
}

function buildMultiBlockContainer(
  text: string,
  fontFamily: string,
  fontSize: number,
  textAlign: TextAlign = DEFAULT_PARAGRAPH_TEXT_ALIGN,
  color?: string,
  textGradientColor?: string,
  lineHeight: number = DEFAULT_PARAGRAPH_LINE_HEIGHT,
  verticalAlign: VerticalAlign = DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
): MultiBlockContainerNode {
  const marks: TextMark[] = [
    {
      type: 'textStyle',
      attrs: {
        fontFamily,
        fontSize: formatFontSizePt(fontSize),
      },
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
    type: 'multiBlockContainer',
    attrs: {
      padding: DEFAULT_MULTI_BLOCK_CONTAINER_PADDING,
      verticalAlign,
    },
    content: [
      {
        type: 'paragraph',
        attrs: { textAlign, lineHeight },
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
    typeof props.fontFamily === 'string'
      ? normalizeFontFamily(props.fontFamily)
      : resolveInheritedFontFamily(el.parentElement ?? el, defaultFontFamily);
  const fontSize = parseFontSize(
    typeof props.fontSize === 'string' || typeof props.fontSize === 'number'
      ? props.fontSize
      : undefined,
    defaultFontSize,
  );
  const cssLineHeight = parseCssLineHeight(
    typeof props.lineHeight === 'string' || typeof props.lineHeight === 'number'
      ? props.lineHeight
      : undefined,
    fontSize,
  );
  const lineHeight = toStoredLineHeight(cssLineHeight);

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
  const textAlign = parseHorizontalAlign(el, '', textAnchor);
  const verticalAlign = parseVerticalAlign(el, '', dominantBaseline);

  return {
    left,
    top,
    width,
    height,
    multiBlockContainer: buildMultiBlockContainer(
      content,
      fontFamily,
      fontSize,
      textAlign,
      color,
      textGradientColor,
      lineHeight,
      verticalAlign,
    ),
    sourceElement: el,
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
  const foStyle = el.getAttribute('style') ?? '';
  const combinedStyle = [foStyle, style].filter(Boolean).join(';');
  const fontSize = parseFontSize(parseStyleValue(style, 'font-size'), defaultFontSize);
  const spanFontFamily = parseStyleValue(style, 'font-family');
  const fontFamily = spanFontFamily
    ? normalizeFontFamily(spanFontFamily)
    : resolveInheritedFontFamily(el, defaultFontFamily);
  const textAlign = parseHorizontalAlign(el, combinedStyle);
  const verticalAlign = parseVerticalAlign(el, combinedStyle);
  const cssLineHeight = parseCssLineHeight(parseStyleValue(style, 'line-height'), fontSize);
  const lineHeight = toStoredLineHeight(cssLineHeight);

  const rawWidth = parseNumAttr(el, 'width');
  const estimated = estimateTextBounds(content, fontSize);
  const height = parseNumAttr(el, 'height') ?? estimated.height;

  const anchor = getAbsoluteAnchor(el);
  let { left, top } = toDeckCoords(anchor.x, anchor.y, viewBox);
  let width = rawWidth ?? estimated.width;
  // 仅对 AntV 精确测量过的 FO 宽度加余量；估算宽度本身已较松
  if (rawWidth !== undefined) {
    ({ width, left } = applyForeignObjectWidthSlack(width, left));
  }
  const { color, textGradientColor } = parseTextColor({ style, svgRoot });

  return {
    left,
    top,
    width,
    height,
    multiBlockContainer: buildMultiBlockContainer(
      content,
      fontFamily,
      fontSize,
      textAlign,
      color,
      textGradientColor,
      lineHeight,
      verticalAlign,
    ),
    sourceElement: el,
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
): MultiBlockContainerNode[] {
  const viewBox = {
    minX: 0,
    minY: 0,
    width: 800,
    height: 600,
    viewBox: '0 0 800 600',
  };
  return extractTextDeckNodes(svgRoot, viewBox, defaultFontFamily, defaultFontSize, ctx).map(
    (c) => c.multiBlockContainer,
  );
}
