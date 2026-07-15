import { parseViewBox } from './transform-utils.js';
import { extractTextDeckNodes } from './text-extractor.js';
import { elementToCommand, svgElementToCommands } from './svg-to-commands.js';
import {
  bboxHeight,
  bboxWidth,
  estimateWorldBBox,
  expandBBox,
  getAncestorTransformList,
  isValidBBox,
} from './svg-bbox.js';
import {
  buildDefsIndex,
  buildLocalDefsCommand,
  collectReferencedDefIdsFromCommands,
  estimateFilterPadding,
  extractIdRefsFromValue,
  rewriteCommandsIds,
} from './svg-defs.js';
import { collectGraphicBlocks } from './svg-split-blocks.js';
import { mergeByDocumentPaintOrder, type PaintOrderItem } from './deck-paint-order.js';
import { buildColorSlotLookup } from '../theme/build-theme-from-infographic.js';
import { DEFAULT_DECK_THEME_CONFIG } from '../theme/deck-theme.js';
import { tokenizeDeckDocumentColors } from '../theme/tokenize-colors.js';
import type {
  CommandsItem,
  ConvertOptions,
  ConvertResult,
  DeckDocument,
  DeckNode,
  SvgNode,
} from '../types/deck.js';

const DEFAULT_OPTIONS: Required<Omit<ConvertOptions, 'theme'>> & Pick<ConvertOptions, 'theme'> = {
  offsetTop: 0,
  offsetLeft: 0,
  extractText: true,
  defaultFontSize: 14,
  defaultFontFamily: 'sans-serif',
  theme: undefined,
  mapColorsToThemeSlots: false,
};

const MIN_BLOCK_SIZE = 1;
/** 带描边的细线至少占这么多像素，避免 overflow 裁掉 stroke */
const MIN_STROKED_SPAN = 3;

function elementHasStroke(el: Element): boolean {
  const stroke = el.getAttribute('stroke');
  if (stroke && stroke !== 'none') return true;
  const sw = el.getAttribute('stroke-width');
  if (sw && parseFloat(sw) > 0) return true;
  const style = (el as SVGElement).style;
  if (style?.stroke && style.stroke !== 'none') return true;
  return false;
}

function findSvgRoot(doc: Document): SVGSVGElement | null {
  return doc.querySelector('svg');
}

function wrapWithAncestorTransforms(
  el: Element,
  command: CommandsItem,
): CommandsItem {
  const transforms = getAncestorTransformList(el);
  let result = command;
  // 从近到远包一层：先自身坐标，再套祖先 transform（列表已是从外到内）
  for (let i = transforms.length - 1; i >= 0; i -= 1) {
    result = {
      comp: 'g',
      transform: transforms[i],
      children: [result],
    };
  }
  return result;
}

function isEmptyGraphicCommand(item: CommandsItem | null): boolean {
  if (!item) return true;
  if (item.comp !== 'g' && item.comp !== 'a') return false;
  if (!item.children?.length) return true;
  return item.children.every((child) => isEmptyGraphicCommand(child));
}

/** 去掉引用不到 symbol/defs 的 <use>，避免空 use 在 TipTap 里显示成小方块 */
function stripUnresolvedUses(
  item: CommandsItem,
  defsIndex: Map<string, Element>,
): CommandsItem | null {
  if (item.comp === 'use') {
    const href = item.href ?? item.xlinkHref;
    if (typeof href !== 'string') return null;
    const ids = extractIdRefsFromValue(href);
    if (ids.length === 0 || !ids.some((id) => defsIndex.has(id))) {
      return null;
    }
    return item;
  }
  if (!item.children?.length) {
    return item;
  }
  const children = item.children
    .map((child) => stripUnresolvedUses(child, defsIndex))
    .filter((child): child is CommandsItem => child != null);
  return { ...item, ...(children.length > 0 ? { children } : { children: [] }) };
}

function buildSvgDeckNode(
  blockEl: Element,
  blockIndex: number,
  opts: typeof DEFAULT_OPTIONS,
  defsIndex: Map<string, Element>,
  viewBox: { minX: number; minY: number },
  cmdCtx: {
    skippedNodes: string[];
    commandCount: number;
    skipForeignObject?: boolean;
    skipTextElements?: boolean;
  },
): DeckNode | null {
  const rawCommand = elementToCommand(blockEl, cmdCtx);
  if (isEmptyGraphicCommand(rawCommand)) {
    return null;
  }

  const wrapped = wrapWithAncestorTransforms(blockEl, rawCommand!);
  const cleaned = stripUnresolvedUses(wrapped, defsIndex);
  if (isEmptyGraphicCommand(cleaned)) {
    return null;
  }
  let graphicCommands: CommandsItem[] = [cleaned!];

  const referencedIds = collectReferencedDefIdsFromCommands(graphicCommands, defsIndex);
  const { defsCommand, idMap } = buildLocalDefsCommand(
    referencedIds,
    defsIndex,
    `dn${blockIndex}_`,
    cmdCtx,
  );

  graphicCommands = rewriteCommandsIds(graphicCommands, idMap);
  const commands: CommandsItem[] = defsCommand
    ? [defsCommand, ...graphicCommands]
    : graphicCommands;

  let box = estimateWorldBBox(blockEl, opts.extractText);
  if (!box || !isValidBBox(box)) {
    return null;
  }

  const filterPad = estimateFilterPadding(blockEl, defsIndex);
  if (filterPad > 0) {
    box = expandBBox(box, filterPad);
  }

  // 避免 0 尺寸；细描边再抬一点，否则 1px 横/竖线会被 overflow:hidden 裁没（X 轴典型问题）
  const minSpan = elementHasStroke(blockEl) ? MIN_STROKED_SPAN : MIN_BLOCK_SIZE;
  let width = Math.max(bboxWidth(box), minSpan);
  let height = Math.max(bboxHeight(box), minSpan);
  let minX = box.minX;
  let minY = box.minY;
  if (bboxWidth(box) < minSpan) {
    minX = box.minX - (minSpan - bboxWidth(box)) / 2;
    width = minSpan;
  }
  if (bboxHeight(box) < minSpan) {
    minY = box.minY - (minSpan - bboxHeight(box)) / 2;
    height = minSpan;
  }

  // svg.viewBox 仍用 SVG 用户坐标；deckNode.left/top 与文字一致，相对根 viewBox 原点
  const svgNode: SvgNode = {
    type: 'svg',
    attrs: {
      width,
      height,
      viewBox: `${minX} ${minY} ${width} ${height}`,
      commands,
    },
  };

  return {
    type: 'deckNode',
    attrs: {
      width,
      height,
      top: minY - viewBox.minY + opts.offsetTop,
      left: minX - viewBox.minX + opts.offsetLeft,
    },
    content: [svgNode],
  };
}

/**
 * 将 SVG 字符串转换为 TipTap deck 文档 JSON。
 * 图形按偏粗粒度拆成 svg deckNode（item `<g>` / 装饰整组），文字仍提取为 multiBlockContainer。
 * 每个小 svg 仅拷贝其引用到的 defs，并改写 id 避免冲突。
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
    skipTextElements: opts.extractText,
  };
  const textCtx = { textNodeCount: 0 };
  const defsIndex = buildDefsIndex(svgRoot);

  const blocks = collectGraphicBlocks(svgRoot, opts.extractText);
  const paintItems: Array<PaintOrderItem<DeckNode>> = [];

  if (blocks.length === 0) {
    // 回退：整图一个 svg（兼容无分组的简单 SVG）
    const commands = svgElementToCommands(svgRoot, cmdCtx);
    // 整图模式下 defs 已在 commands 内，无需再拆
    paintItems.push({
      source: svgRoot,
      node: {
        type: 'deckNode',
        attrs: {
          width: viewBox.width,
          height: viewBox.height,
          top: opts.offsetTop,
          left: opts.offsetLeft,
        },
        content: [
          {
            type: 'svg',
            attrs: {
              width: viewBox.width,
              height: viewBox.height,
              viewBox: viewBox.viewBox,
              commands,
            },
          },
        ],
      },
    });
  } else {
    let blockIndex = 0;
    for (const blockEl of blocks) {
      const node = buildSvgDeckNode(blockEl, blockIndex, opts, defsIndex, viewBox, cmdCtx);
      if (node) {
        paintItems.push({ source: blockEl, node });
        blockIndex += 1;
      }
    }

    // 拆完后若一个图形都没有（例如纯文本图），仍给一个空壳避免 deck 无节点
    if (paintItems.length === 0 && !opts.extractText) {
      const commands = svgElementToCommands(svgRoot, cmdCtx);
      paintItems.push({
        source: svgRoot,
        node: {
          type: 'deckNode',
          attrs: {
            width: viewBox.width,
            height: viewBox.height,
            top: opts.offsetTop,
            left: opts.offsetLeft,
          },
          content: [
            {
              type: 'svg',
              attrs: {
                width: viewBox.width,
                height: viewBox.height,
                viewBox: viewBox.viewBox,
                commands,
              },
            },
          ],
        },
      });
    }
  }

  if (opts.extractText) {
    const textCandidates = extractTextDeckNodes(
      svgRoot,
      viewBox,
      opts.defaultFontFamily,
      opts.defaultFontSize,
      textCtx,
    );
    for (const item of textCandidates) {
      paintItems.push({
        source: item.sourceElement,
        node: {
          type: 'deckNode',
          attrs: {
            width: item.width,
            height: item.height,
            top: item.top + opts.offsetTop,
            left: item.left + opts.offsetLeft,
          },
          content: [item.multiBlockContainer],
        },
      });
    }
  }

  // 叠放：严格按源 SVG 文档序交错（底色 → 早文字 → 柱 → 晚文字）
  const deckNodes = mergeByDocumentPaintOrder(paintItems);

  const theme = opts.theme ?? DEFAULT_DECK_THEME_CONFIG;
  let document: DeckDocument = {
    type: 'deck',
    attrs: {
      theme,
      // offset 只平移节点；画布需加大，否则底/右侧会被 overflow 裁掉
      width: viewBox.width + Math.max(0, opts.offsetLeft),
      height: viewBox.height + Math.max(0, opts.offsetTop),
    },
    content: deckNodes,
  };

  if (opts.mapColorsToThemeSlots) {
    const lookup = buildColorSlotLookup(theme.clrScheme);
    document = tokenizeDeckDocumentColors(document, lookup);
  }

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
