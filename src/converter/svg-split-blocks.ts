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
    // 空 g：视为无图形
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

/**
 * 是否继续拆分子节点：多个图形子节点时拆开，细到 item / 叶子 shape。
 */
function shouldSplitChildren(kids: Element[]): boolean {
  return kids.length > 1;
}

/**
 * 收集应各自成为一个 svg deckNode 的图形块元素。
 * - 多个兄弟图形 / item `<g>` 时继续往下拆
 * - `skipTextOnly=true` 时跳过纯文本子树（文字走 extractTextDeckNodes）
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

    if (tag !== 'g' && tag !== 'a' && tag !== 'svg') {
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

    // 单一子节点：若子节点仍是可拆的 g，继续下钻；否则整块输出
    const only = kids[0];
    if (
      (only.tagName.toLowerCase() === 'g' || only.tagName.toLowerCase() === 'a') &&
      graphicChildren(only, skipTextOnly).length > 1
    ) {
      visit(only);
      return;
    }

    // 叶子 item 组：整组作为一个块（内部文本在转 commands 时会被 skip）
    if (hasGraphicContent(el)) {
      blocks.push(el);
    }
  };

  for (const root of roots) {
    visit(root);
  }

  return blocks;
}
