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

function scaleSvgNode(node: SvgNode, target: TargetSize): SvgNode {
  return {
    ...node,
    attrs: {
      ...node.attrs,
      width: target.width,
      height: target.height,
      // 保留原始 viewBox，由 width/height 拉伸显示
      viewBox: node.attrs.viewBox,
      commands: node.attrs.commands as CommandsItem[],
    },
  };
}

function scaleDeckNodeChild(
  child: DeckNodeChild,
  target: TargetSize,
  fontScale: number,
): DeckNodeChild {
  if (child.type === 'svg') {
    return scaleSvgNode(child, target);
  }
  return scaleMultiBlockContainer(child, fontScale);
}

function scaleDeckNode(
  node: DeckNode,
  scaleX: number,
  scaleY: number,
  fontScale: number,
  target: TargetSize,
): DeckNode {
  const child = node.content[0];
  const isSvg = child?.type === 'svg';

  return {
    ...node,
    attrs: {
      width: isSvg ? target.width : scaleNumber(node.attrs.width, scaleX),
      height: isSvg ? target.height : scaleNumber(node.attrs.height, scaleY),
      top: scaleNumber(node.attrs.top, scaleY),
      left: scaleNumber(node.attrs.left, scaleX),
    },
    content: [scaleDeckNodeChild(child, target, fontScale)],
  };
}

function findNaturalSize(document: DeckDocument): { width: number; height: number } | null {
  for (const node of document.content) {
    const child = node.content[0];
    if (child?.type === 'svg') {
      return {
        width: child.attrs.width,
        height: child.attrs.height,
      };
    }
  }
  return null;
}

/**
 * 将 deck 从 Infographic 固有 viewBox 尺寸拉伸到目标宽高。
 * SVG 图形保留 viewBox，只改显示宽高；文本节点同步缩放位置与字号。
 */
export function scaleDeckDocument(document: DeckDocument, target: TargetSize): DeckDocument {
  const natural = findNaturalSize(document);
  if (!natural || natural.width <= 0 || natural.height <= 0) {
    return document;
  }
  if (natural.width === target.width && natural.height === target.height) {
    return document;
  }

  const scaleX = target.width / natural.width;
  const scaleY = target.height / natural.height;
  const fontScale = Math.sqrt(scaleX * scaleY);

  return {
    ...document,
    content: document.content.map((node) =>
      scaleDeckNode(node, scaleX, scaleY, fontScale, target),
    ),
  };
}

export function scaleConvertResult(result: ConvertResult, target: TargetSize): ConvertResult {
  return {
    ...result,
    document: scaleDeckDocument(result.document, target),
  };
}

/**
 * 把 SVG 根节点的 width/height 写成目标像素，便于预览与二次转换。
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

  // 若缺少 viewBox，用当前解析结果补上，避免只改宽高后坐标系丢失
  if (!svgRoot.getAttribute('viewBox')) {
    const viewBox = parseViewBox(svgRoot);
    svgRoot.setAttribute('viewBox', viewBox.viewBox);
  }

  return new XMLSerializer().serializeToString(svgRoot);
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

/** 在缩放之后再叠加偏移，避免 offset 被一起放大 */
export function applyDeckOffsets(
  document: DeckDocument,
  offsetTop = 0,
  offsetLeft = 0,
): DeckDocument {
  if (offsetTop === 0 && offsetLeft === 0) {
    return document;
  }
  return {
    ...document,
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

function findNaturalSizeFromDocument(document: DeckDocument): TargetSize | null {
  for (const node of document.content) {
    const child = node.content[0];
    if (child?.type === 'svg') {
      return { width: child.attrs.width, height: child.attrs.height };
    }
  }
  return null;
}

/**
 * 转换后按目标宽高拉伸 deck，并把 SVG 的 width/height 写成目标像素。
 * offset 在缩放之后再叠加，保持为绝对像素。
 */
export function finalizeSizedConvertResult(
  svg: string,
  result: ConvertResult,
  size: { width?: number; height?: number },
  options: { offsetTop?: number; offsetLeft?: number } = {},
): { svg: string; result: ConvertResult } {
  const offsetTop = options.offsetTop ?? 0;
  const offsetLeft = options.offsetLeft ?? 0;

  const unoffsetDocument =
    offsetTop !== 0 || offsetLeft !== 0
      ? applyDeckOffsets(result.document, -offsetTop, -offsetLeft)
      : result.document;

  const natural = findNaturalSizeFromDocument(unoffsetDocument);
  const target = natural ? resolveTargetSize(size, natural) : null;

  let document = unoffsetDocument;
  let nextSvg = svg;

  if (target) {
    document = scaleConvertResult({ ...result, document }, target).document;
    nextSvg = applySvgPixelSize(svg, target);
  }

  document = applyDeckOffsets(document, offsetTop, offsetLeft);

  return {
    svg: nextSvg,
    result: {
      ...result,
      document,
    },
  };
}
