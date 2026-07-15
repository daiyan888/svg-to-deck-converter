import type {
  CommandsItem,
  ConvertResult,
  DeckDocument,
  DeckNode,
  DeckNodeChild,
  MultiBlockContainerNode,
  ParagraphNode,
  SvgNode,
  TextMark,
  TextNode,
} from '../types/deck.js';
import { parseViewBox } from './transform-utils.js';

export interface TargetSize {
  width: number;
  height: number;
}

function serializeSvgElement(el: Element): string {
  const Serializer = (globalThis as { XMLSerializer?: typeof XMLSerializer }).XMLSerializer;
  if (typeof Serializer === 'function') {
    return new Serializer().serializeToString(el);
  }
  // linkedom / 部分 SSR 环境可能未挂 XMLSerializer
  return (el as Element & { outerHTML?: string }).outerHTML ?? '';
}

function scaleNumber(value: number, scale: number): number {
  return value * scale;
}

function scaleFontSize(fontSize: string, scale: number): string {
  const match = fontSize.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+))(px|pt|em|rem|%)?$/i);
  if (!match) {
    return fontSize;
  }
  const next = Number(match[1]) * scale;
  const unit = match[2] ?? '';
  return `${next}${unit}`;
}

function scaleTextMarks(marks: TextMark[] | undefined, fontScale: number): TextMark[] | undefined {
  if (!marks?.length) {
    return marks;
  }
  return marks.map((mark) => {
    if (mark.type !== 'textStyle') {
      return mark;
    }
    return {
      ...mark,
      attrs: {
        ...mark.attrs,
        fontSize: scaleFontSize(mark.attrs.fontSize, fontScale),
      },
    };
  });
}

function scaleTextNode(node: TextNode, fontScale: number): TextNode {
  return {
    ...node,
    marks: scaleTextMarks(node.marks, fontScale),
  };
}

function scaleParagraph(node: ParagraphNode, fontScale: number): ParagraphNode {
  return {
    ...node,
    content: node.content.map((text) => scaleTextNode(text, fontScale)),
  };
}

function scaleMultiBlockContainer(
  node: MultiBlockContainerNode,
  fontScale: number,
): MultiBlockContainerNode {
  return {
    ...node,
    content: node.content.map((paragraph) => scaleParagraph(paragraph, fontScale)),
  };
}

/**
 * 缩放单个 svg 节点的像素宽高；viewBox（用户坐标）保持不变。
 * 多块拆分后每个小 svg 只占自己的 bbox，不能再铺满整幅画布。
 */
function scaleSvgNode(node: SvgNode, scale: number): SvgNode {
  return {
    ...node,
    attrs: {
      ...node.attrs,
      width: scaleNumber(node.attrs.width, scale),
      height: scaleNumber(node.attrs.height, scale),
      viewBox: node.attrs.viewBox,
      commands: node.attrs.commands as CommandsItem[],
    },
  };
}

function scaleDeckNodeChild(child: DeckNodeChild, scale: number): DeckNodeChild {
  if (child.type === 'svg') {
    return scaleSvgNode(child, scale);
  }
  return scaleMultiBlockContainer(child, scale);
}

/**
 * 计算与 SVG `preserveAspectRatio="xMidYMid meet"` 相同的等比缩放与居中偏移。
 */
export function computeMeetLayout(
  natural: TargetSize,
  target: TargetSize,
): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(target.width / natural.width, target.height / natural.height);
  const contentWidth = natural.width * scale;
  const contentHeight = natural.height * scale;
  return {
    scale,
    offsetX: (target.width - contentWidth) / 2,
    offsetY: (target.height - contentHeight) / 2,
  };
}

function scaleDeckNode(
  node: DeckNode,
  scale: number,
  offsetX: number,
  offsetY: number,
): DeckNode {
  const child = node.content[0];

  return {
    ...node,
    attrs: {
      ...node.attrs,
      width: scaleNumber(node.attrs.width, scale),
      height: scaleNumber(node.attrs.height, scale),
      top: scaleNumber(node.attrs.top, scale) + offsetY,
      left: scaleNumber(node.attrs.left, scale) + offsetX,
    },
    content: [scaleDeckNodeChild(child, scale)],
  };
}

/**
 * 从全部 deckNode 的占位估算画布尺寸（无原始 SVG 时的回退）。
 * 多块拆分后不能再用「第一个 svg 的宽高」——那往往只是一根细线。
 */
export function estimateNaturalSizeFromDocument(document: DeckDocument): TargetSize | null {
  let maxRight = 0;
  let maxBottom = 0;
  let hasNode = false;

  for (const node of document.content) {
    hasNode = true;
    maxRight = Math.max(maxRight, node.attrs.left + node.attrs.width);
    maxBottom = Math.max(maxBottom, node.attrs.top + node.attrs.height);
  }

  if (!hasNode || maxRight <= 0 || maxBottom <= 0) {
    return null;
  }
  return { width: maxRight, height: maxBottom };
}

/**
 * 从原始 SVG 字符串解析固有画布尺寸（优先于 deckNode 估算）。
 */
export function resolveNaturalSizeFromSvg(svgString: string): TargetSize | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      return null;
    }
    const svgRoot = doc.querySelector('svg');
    if (!svgRoot) {
      return null;
    }
    const viewBox = parseViewBox(svgRoot);
    if (viewBox.width <= 0 || viewBox.height <= 0) {
      return null;
    }
    return { width: viewBox.width, height: viewBox.height };
  } catch {
    return null;
  }
}

/**
 * 将 deck 从 Infographic 固有尺寸适配到目标宽高。
 * 使用与 SVG 默认 `meet` 相同的等比缩放 + 居中留白。
 * @param natural 固有画布尺寸；不传则从 deckNode 占位估算
 */
export function scaleDeckDocument(
  document: DeckDocument,
  target: TargetSize,
  natural?: TargetSize | null,
): DeckDocument {
  const resolvedNatural = natural ?? estimateNaturalSizeFromDocument(document);
  if (!resolvedNatural || resolvedNatural.width <= 0 || resolvedNatural.height <= 0) {
    return document;
  }
  if (resolvedNatural.width === target.width && resolvedNatural.height === target.height) {
    return document;
  }

  const { scale, offsetX, offsetY } = computeMeetLayout(resolvedNatural, target);

  return {
    ...document,
    attrs: {
      ...document.attrs,
      width: target.width,
      height: target.height,
    },
    content: document.content.map((node) => scaleDeckNode(node, scale, offsetX, offsetY)),
  };
}

export function scaleConvertResult(
  result: ConvertResult,
  target: TargetSize,
  natural?: TargetSize | null,
): ConvertResult {
  return {
    ...result,
    document: scaleDeckDocument(result.document, target, natural),
  };
}

/**
 * 把 SVG 根节点的 width/height 写成目标像素，便于预览与二次转换。
 * 保留默认 preserveAspectRatio=meet，与 deck 文本缩放一致。
 */
export function applySvgPixelSize(svgString: string, target: TargetSize): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return svgString;
  }

  const svgRoot = doc.querySelector('svg');
  if (!svgRoot) {
    return svgString;
  }

  svgRoot.setAttribute('width', String(target.width));
  svgRoot.setAttribute('height', String(target.height));
  // 明确 meet，避免上游带上 none 导致预览与 deck 不一致
  if (!svgRoot.getAttribute('preserveAspectRatio')) {
    svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  // 若缺少 viewBox，用当前解析结果补上，避免只改宽高后坐标系丢失
  if (!svgRoot.getAttribute('viewBox')) {
    const viewBox = parseViewBox(svgRoot);
    svgRoot.setAttribute('viewBox', viewBox.viewBox);
  }

  return serializeSvgElement(svgRoot);
}

export function resolveTargetSize(
  size: { width?: number; height?: number },
  natural: { width: number; height: number },
): TargetSize | null {
  if (size.width == null && size.height == null) {
    return null;
  }
  return {
    width: size.width != null && size.width > 0 ? size.width : natural.width,
    height: size.height != null && size.height > 0 ? size.height : natural.height,
  };
}

/** 在缩放之后再叠加偏移，避免 offset 被一起放大；并扩展画布以免裁切 */
export function applyDeckOffsets(
  document: DeckDocument,
  offsetTop = 0,
  offsetLeft = 0,
): DeckDocument {
  if (offsetTop === 0 && offsetLeft === 0) {
    return document;
  }

  const baseWidth =
    typeof document.attrs.width === 'number' && document.attrs.width > 0
      ? document.attrs.width
      : estimateNaturalSizeFromDocument(document)?.width;
  const baseHeight =
    typeof document.attrs.height === 'number' && document.attrs.height > 0
      ? document.attrs.height
      : estimateNaturalSizeFromDocument(document)?.height;

  return {
    ...document,
    attrs: {
      ...document.attrs,
      ...(baseWidth != null
        ? { width: baseWidth + Math.max(0, offsetLeft) }
        : {}),
      ...(baseHeight != null
        ? { height: baseHeight + Math.max(0, offsetTop) }
        : {}),
    },
    content: document.content.map((node) => ({
      ...node,
      attrs: {
        ...node.attrs,
        top: node.attrs.top + offsetTop,
        left: node.attrs.left + offsetLeft,
      },
    })),
  };
}

/**
 * 转换后按目标宽高适配 deck（等比 meet），并把源 SVG 的 width/height 写成目标像素。
 * 调用方应先以 offset=0 转换，再由本函数在缩放后统一叠加 offset（作用于全部 deckNode）。
 *
 * 固有尺寸优先取原始 SVG 的 viewBox（整幅画布），不能用拆分后的单个小 svg bbox。
 */
export function finalizeSizedConvertResult(
  svg: string,
  result: ConvertResult,
  size: { width?: number; height?: number },
  options: { offsetTop?: number; offsetLeft?: number } = {},
): { svg: string; result: ConvertResult } {
  const offsetTop = options.offsetTop ?? 0;
  const offsetLeft = options.offsetLeft ?? 0;

  const natural =
    resolveNaturalSizeFromSvg(svg) ?? estimateNaturalSizeFromDocument(result.document);
  const target = natural ? resolveTargetSize(size, natural) : null;

  let document = result.document;
  let nextSvg = svg;

  if (target && natural) {
    document = scaleConvertResult({ ...result, document }, target, natural).document;
    nextSvg = applySvgPixelSize(svg, target);
  }

  // SVG 与 multiBlockContainer 所在的每个 deckNode 一并偏移
  document = applyDeckOffsets(document, offsetTop, offsetLeft);

  return {
    svg: nextSvg,
    result: {
      ...result,
      document,
    },
  };
}
