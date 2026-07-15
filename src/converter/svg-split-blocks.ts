import { isAntvEditorChrome, isTextElement } from './svg-tags.js';

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

const AXIS_ALIGN_EPS = 0.5;

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
  if (isAntvEditorChrome(el)) return true;
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
  if (isAntvEditorChrome(el)) return false;
  if (isShapeLeaf(el)) return true;
  if (isTextNode(el)) return false;
  return getElementChildren(el).some((child) => hasGraphicContent(child));
}

function graphicChildren(el: Element, skipTextOnly: boolean): Element[] {
  return getElementChildren(el).filter((child) => {
    const tag = child.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return false;
    if (isAntvEditorChrome(child)) return false;
    if (skipTextOnly && isTextOnlySubtree(child)) return false;
    return hasGraphicContent(child) || (!skipTextOnly && !isTextOnlySubtree(child));
  });
}

function hasPaintFill(el: Element): boolean {
  const fill = el.getAttribute('fill');
  return !!fill && fill !== 'none';
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
  if (hasPaintFill(el)) {
    return false;
  }
  return true;
}

function isFilledRectLeaf(el: Element): boolean {
  return el.tagName.toLowerCase() === 'rect' && hasPaintFill(el);
}

function isFilledPathLeaf(el: Element): boolean {
  return el.tagName.toLowerCase() === 'path' && hasPaintFill(el);
}

function isFilledMarkerLeaf(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return (tag === 'circle' || tag === 'ellipse') && hasPaintFill(el);
}

function isFilledPolygonLeaf(el: Element): boolean {
  return el.tagName.toLowerCase() === 'polygon' && hasPaintFill(el);
}

function rectSize(el: Element): { w: number; h: number } {
  return {
    w: Math.abs(Number(el.getAttribute('width') ?? 0)),
    h: Math.abs(Number(el.getAttribute('height') ?? 0)),
  };
}

/**
 * 同层 filled rect：柱状数据可拆；卡片大底 + 细色条等 chrome 不拆。
 */
function isSplittableFilledRectGroup(kids: Element[]): boolean {
  if (!kids.every(isFilledRectLeaf) || kids.length < 2) return false;

  const sizes = kids.map(rectSize);
  const areas = sizes.map((s) => s.w * s.h);
  const maxArea = Math.max(...areas);
  const minArea = Math.min(...areas);
  // 面积差过大（如 200×60 底 + 3×60 色条）→ 卡片装饰，整组保留
  if (minArea > 0 && maxArea / minArea > 8) {
    return false;
  }
  // 混有极细条与正常块 → 不拆
  const thinCount = sizes.filter((s) => Math.min(s.w, s.h) > 0 && Math.min(s.w, s.h) < 6).length;
  if (thinCount > 0 && thinCount < sizes.length) {
    return false;
  }
  return true;
}

/** 同质可拆数据叶子：柱 / 扇区 / marker / sequence 箭头 */
function isSplittableHomogeneousLeaves(kids: Element[]): boolean {
  if (isSplittableFilledRectGroup(kids)) return true;
  if (kids.every(isFilledPathLeaf)) return true;
  if (kids.every(isFilledMarkerLeaf)) return true;
  if (kids.every(isFilledPolygonLeaf)) return true;
  return false;
}

function isAxisAligned(x1: number, y1: number, x2: number, y2: number): boolean {
  return Math.abs(x1 - x2) < AXIS_ALIGN_EPS || Math.abs(y1 - y2) < AXIS_ALIGN_EPS;
}

function parseNumberList(raw: string): number[] {
  return raw
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/** 路径/折线是否全为轴对齐线段（网格、坐标轴）；含斜线或曲线则否（引线） */
export function isAxisAlignedStrokeGeometry(el: Element): boolean {
  const tag = el.tagName.toLowerCase();

  if (tag === 'line') {
    const x1 = Number(el.getAttribute('x1') ?? 0);
    const y1 = Number(el.getAttribute('y1') ?? 0);
    const x2 = Number(el.getAttribute('x2') ?? 0);
    const y2 = Number(el.getAttribute('y2') ?? 0);
    return isAxisAligned(x1, y1, x2, y2);
  }

  if (tag === 'polyline') {
    const pts = parseNumberList(el.getAttribute('points') ?? '');
    if (pts.length < 4) return false;
    for (let i = 0; i + 3 < pts.length; i += 2) {
      if (!isAxisAligned(pts[i], pts[i + 1], pts[i + 2], pts[i + 3])) {
        return false;
      }
    }
    return true;
  }

  if (tag !== 'path') return false;

  const d = (el.getAttribute('d') ?? '').trim();
  if (!d) return false;

  // 仅接受 M/L/H/V/Z；出现曲线/弧 → 非网格轴（更像引线或系列线）
  if (/[AaCcQqSsTt]/.test(d)) {
    return false;
  }

  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const re = /([MmLlHhVvZz])([^MmLlHhVvZz]*)/g;
  let match: RegExpExecArray | null;
  let sawSegment = false;

  while ((match = re.exec(d)) !== null) {
    const cmd = match[1];
    const nums = parseNumberList(match[2] ?? '');
    const lower = cmd.toLowerCase();

    if (lower === 'z') {
      if (!isAxisAligned(x, y, startX, startY)) return false;
      x = startX;
      y = startY;
      continue;
    }

    if (lower === 'm') {
      if (cmd === 'M') {
        if (nums.length < 2) return false;
        x = nums[0];
        y = nums[1];
      } else {
        if (nums.length < 2) return false;
        x += nums[0];
        y += nums[1];
      }
      startX = x;
      startY = y;
      // 多余的成对坐标按 L 处理
      for (let i = 2; i + 1 < nums.length; i += 2) {
        const nx = cmd === 'M' ? nums[i] : x + nums[i];
        const ny = cmd === 'M' ? nums[i + 1] : y + nums[i + 1];
        if (!isAxisAligned(x, y, nx, ny)) return false;
        x = nx;
        y = ny;
        sawSegment = true;
      }
      continue;
    }

    if (lower === 'l') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const nx = cmd === 'L' ? nums[i] : x + nums[i];
        const ny = cmd === 'L' ? nums[i + 1] : y + nums[i + 1];
        if (!isAxisAligned(x, y, nx, ny)) return false;
        x = nx;
        y = ny;
        sawSegment = true;
      }
      continue;
    }

    if (lower === 'h') {
      for (const n of nums) {
        const nx = cmd === 'H' ? n : x + n;
        if (!isAxisAligned(x, y, nx, y)) return false;
        x = nx;
        sawSegment = true;
      }
      continue;
    }

    if (lower === 'v') {
      for (const n of nums) {
        const ny = cmd === 'V' ? n : y + n;
        if (!isAxisAligned(x, y, x, ny)) return false;
        y = ny;
        sawSegment = true;
      }
    }
  }

  return sawSegment;
}

/**
 * 网格 / 坐标轴：同色 + 全轴对齐描边。
 * 饼图引线：异色或含斜线段 → 不满足，应拆成一条一线。
 */
export function isGridOrAxisStrokeGroup(kids: Element[]): boolean {
  if (kids.length === 0 || !kids.every(isStrokeLineArtLeaf)) return false;
  const strokes = new Set(kids.map((k) => k.getAttribute('stroke') ?? ''));
  if (strokes.size !== 1) return false;
  return kids.every(isAxisAlignedStrokeGeometry);
}

/**
 * 是否继续拆分子节点（档 2）：
 * - 多个 item 级 `<g>` → 拆开
 * - 同质数据叶子（柱 rect / 扇区 path / marker / polygon 箭头）→ 拆开
 * - 引线（非网格轴的描边线艺）→ 一条一线
 * - 网格 / 坐标轴 → 不拆
 * - 折线+面积等异质叶子 / 装饰混杂 → 不拆
 */
function shouldSplitChildren(kids: Element[]): boolean {
  if (kids.length <= 1) return false;

  if (kids.every(isStrokeLineArtLeaf)) {
    return !isGridOrAxisStrokeGroup(kids);
  }

  if (kids.every(isShapeLeaf) && isSplittableHomogeneousLeaves(kids)) {
    return true;
  }

  const groupKids = kids.filter(isGroupLike);
  return groupKids.length > 1;
}

/**
 * 收集应各自成为一个 svg deckNode 的图形块。
 * 粒度：item `<g>` + 档 2 数据叶子 / 引线；网格轴与异质装饰层整组保留。
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
    if (isAntvEditorChrome(el)) return;

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

    // 单一分组子节点且其下仍应拆 → 继续下钻（如 column 滤掉文字后只剩柱组）
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
