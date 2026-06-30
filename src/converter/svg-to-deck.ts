import { parseViewBox } from './transform-utils';
import { extractTextDeckNodes } from './text-extractor';
import { svgElementToCommands } from './svg-to-commands';
import type { ConvertOptions, ConvertResult, DeckDocument, DeckNode, SvgNode } from '../types/deck';

const DEFAULT_OPTIONS: Required<ConvertOptions> = {
  offsetTop: 0,
  offsetLeft: 0,
  extractText: true,
  defaultFontSize: 14,
  defaultFontFamily: 'sans-serif',
};

function findSvgRoot(doc: Document): SVGSVGElement | null {
  return doc.querySelector('svg');
}

/**
 * 将 SVG 字符串转换为 TipTap deck 文档 JSON
 * 每个 deckNode 只有一个子节点，多个元素拆成多个 deckNode，由 left/top 相对 deck 定位
 */
export function convertSvgToDeck(svgString: string, options: ConvertOptions = {}): ConvertResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`SVG 解析失败: ${parseError.textContent ?? '未知错误'}`);
  }

  const svgRoot = findSvgRoot(doc);
  if (!svgRoot) {
    throw new Error('未找到 <svg> 根元素');
  }

  const viewBox = parseViewBox(svgRoot);
  const cmdCtx = {
    skippedNodes: [] as string[],
    commandCount: 0,
    skipForeignObject: opts.extractText,
  };
  const textCtx = { textNodeCount: 0 };

  const commands = svgElementToCommands(svgRoot, cmdCtx);
  const svgNode: SvgNode = {
    type: 'svg',
    attrs: {
      width: viewBox.width,
      height: viewBox.height,
      viewBox: viewBox.viewBox,
      commands,
    },
  };

  const deckNodes: DeckNode[] = [
    {
      type: 'deckNode',
      attrs: {
        width: viewBox.width,
        height: viewBox.height,
        top: opts.offsetTop,
        left: opts.offsetLeft,
      },
      content: [svgNode],
    },
  ];

  if (opts.extractText) {
    const textCandidates = extractTextDeckNodes(
      svgRoot,
      viewBox,
      opts.defaultFontFamily,
      opts.defaultFontSize,
      textCtx,
    );
    for (const item of textCandidates) {
      deckNodes.push({
        type: 'deckNode',
        attrs: {
          width: item.width,
          height: item.height,
          top: item.top,
          left: item.left,
        },
        content: [item.multiBlockContain],
      });
    }
  }

  const document: DeckDocument = {
    type: 'deck',
    content: deckNodes,
  };

  return {
    document,
    stats: {
      commandCount: cmdCtx.commandCount,
      textNodeCount: textCtx.textNodeCount,
      skippedNodes: cmdCtx.skippedNodes,
    },
  };
}

/**
 * 从页面中提取 SVG 字符串（用于从 AntV Gallery 等页面复制）
 */
export function extractSvgFromHtml(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const svg = doc.querySelector('svg');
  if (!svg) {
    return null;
  }
  return svg.outerHTML;
}
