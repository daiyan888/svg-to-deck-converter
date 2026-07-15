/**
 * TipTap / CSS 绝对定位叠放规则：
 * deck.content 数组越靠后的 deckNode，渲染时越靠上（后绘制盖住先绘制）。
 *
 * 排序策略：严格按源 SVG 文档序交错排列（与 SVG 画家算法一致）。
 * 例：底色 → 早文字 → 柱A → 柱B → 晚文字
 */

/** a 在文档中是否先于 b（画家算法中更早绘制、层级更低） */
export function isDocumentBefore(a: Node, b: Node): boolean {
  if (a === b) return false;
  const pos = a.compareDocumentPosition(b);
  // FOLLOWING = b 在 a 之后 → a 更早
  return (pos & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

export function compareDocumentOrder(a: Node, b: Node): number {
  if (a === b) return 0;
  return isDocumentBefore(a, b) ? -1 : 1;
}

/** 按源 SVG 文档序稳定排序 */
export function sortByDocumentOrder<T>(items: T[], getNode: (item: T) => Node): T[] {
  return items.slice().sort((x, y) => compareDocumentOrder(getNode(x), getNode(y)));
}

export interface PaintOrderItem<T> {
  node: T;
  source: Node;
}

/** 图形与文字合并后按源节点文档序排列 */
export function mergeByDocumentPaintOrder<T>(items: Array<PaintOrderItem<T>>): T[] {
  return sortByDocumentOrder(items, (item) => item.source).map((item) => item.node);
}
