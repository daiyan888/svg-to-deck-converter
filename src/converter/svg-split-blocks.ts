import { isTextElement } from './svg-tags.js';

const SHAPE_TAGS = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'use',
  'image',
]);

const SKIP_TAGS = new Set(['defs', 'style', 'script', 'title', 'desc', 'metadata']);

function getElementChildren(el: Element): Element[] {
  return Array.from(el.children);
}

function isShapeLeaf(el: Element): boolean {
  return SHAPE_TAGS.has(el.tagName.toLowerCase());
}

function isGroupLike(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return tag === 'g' || tag === 'a';
}

function isTextNode(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return isTextElement(tag) || tag === 'foreignobject';
}

/** 子树是否只含文本（及包装文本的 g），无图形 */
export function isTextOnlySubtree(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return true;
  if (isTextNode(el)) return true;
  if (isShapeLeaf(el)) return false;

  const children = getElementChildren(el);
  if (children.length === 0) {
    return tag === 'g' || tag === 'a';
  }

  return children.every((child) => isTextOnlySubtree(child));
}

/** 子树是否包含至少一个图形元素 */
export function hasGraphicContent(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return false;
  if (isShapeLeaf(el)) return true;
  if (isTextNode(el)) return false;
  return getElementChildren(el).some((child) => hasGraphicContent(child));
}

function graphicChildren(el: Element, skipTextOnly: boolean): Element[] {
  return getElementChildren(el).filter((child) => {
    const tag = child.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (skipTextOnly && isTextOnlySubtree(child)) return false;
    return hasGraphicContent(child) || (!skipTextOnly && !isTextOnlySubtree(child));
  });
}

/** 仅描边、无实心填充的线状图形（path/line/polyline） */
export function isStrokeLineArtLeaf(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag !== 'path' && tag !== 'line' && tag !== 'polyline') {
    return false;
  }
  const stroke = el.getAttribute('stroke');
  if (!stroke || stroke === 'none') {
    return false;
  }
  const fill = el.getAttribute('fill');
  if (fill && fill !== 'none') {
    return false;
  }
  return true;
}

/**
 * 是否继续拆分子节点（偏粗粒度，避免拆到每根柱/每条线）：
 * - 多个 item 级 `<g>` → 拆开（可单独选中/移动）
 * - 同层全是叶子 shape（柱子们、图标 paths）→ 不拆，整组一块
 * - 纯描边线艺（网格、坐标轴+刻度）→ 不拆
 */
function shouldSplitChildren(kids: Element[]): boolean {
  if (kids.length <= 1) return false;
  if (kids.every(isStrokeLineArtLeaf)) return false;
  if (kids.every(isShapeLeaf)) return false;

  const groupKids = kids.filter(isGroupLike);
  // 至少 2 个分组子节点才按 item 拆
  return groupKids.length > 1;
}

/**
 * 收集应各自成为一个 svg deckNode 的图形块。
 * 粒度：item `<g>` 级；装饰层 / 同层叶子图形整组保留。文字仍走 extractText。
 */
export function collectGraphicBlocks(svgRoot: SVGSVGElement, skipTextOnly: boolean): Element[] {
  const blocks: Element[] = [];
  const container =
    svgRoot.querySelector('#infographic-container') ??
    svgRoot.querySelector('[id$="infographic-container"]');

  const roots = container ? getElementChildren(container) : getElementChildren(svgRoot);

  const visit = (el: Element): void => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;

    if (skipTextOnly && isTextOnlySubtree(el)) {
      return;
    }

    if (isShapeLeaf(el)) {
      blocks.push(el);
      return;
    }

    if (isTextNode(el)) {
      if (!skipTextOnly) {
        blocks.push(el);
      }
      return;
    }

    if (!isGroupLike(el) && tag !== 'svg') {
      if (hasGraphicContent(el)) {
        blocks.push(el);
      }
      return;
    }

    const kids = graphicChildren(el, skipTextOnly);
    if (kids.length === 0) {
      return;
    }

    if (shouldSplitChildren(kids)) {
      for (const kid of kids) {
        visit(kid);
      }
      return;
    }

    // 单一分组子节点且其下仍有多个 item 组 → 继续下钻
    const only = kids[0];
    if (
      kids.length === 1 &&
      isGroupLike(only) &&
      shouldSplitChildren(graphicChildren(only, skipTextOnly))
    ) {
      visit(only);
      return;
    }

    if (hasGraphicContent(el)) {
      blocks.push(el);
    }
  };

  for (const root of roots) {
    visit(root);
  }

  return blocks;
}
