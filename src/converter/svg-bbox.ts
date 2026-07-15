/** 轴对齐包围盒（SVG 用户坐标） */
export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const IDENTITY_MATRIX: AffineMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export function emptyBBox(): BBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function isValidBBox(box: BBox): boolean {
  return (
    Number.isFinite(box.minX) &&
    Number.isFinite(box.minY) &&
    Number.isFinite(box.maxX) &&
    Number.isFinite(box.maxY) &&
    box.maxX >= box.minX &&
    box.maxY >= box.minY
  );
}

export function unionBBox(a: BBox, b: BBox): BBox {
  if (!isValidBBox(a)) return { ...b };
  if (!isValidBBox(b)) return { ...a };
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function expandBBox(box: BBox, padding: number): BBox {
  if (!isValidBBox(box) || padding <= 0) return box;
  return {
    minX: box.minX - padding,
    minY: box.minY - padding,
    maxX: box.maxX + padding,
    maxY: box.maxY + padding,
  };
}

export function bboxWidth(box: BBox): number {
  return box.maxX - box.minX;
}

export function bboxHeight(box: BBox): number {
  return box.maxY - box.minY;
}

export function multiplyMatrix(m1: AffineMatrix, m2: AffineMatrix): AffineMatrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

function translateMatrix(tx: number, ty: number): AffineMatrix {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

function parseNumberList(raw: string): number[] {
  return raw
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

/** 解析 SVG transform，支持 translate / matrix / scale（常见 AntV 输出） */
export function parseTransformMatrix(transform: string | null | undefined): AffineMatrix {
  if (!transform?.trim()) {
    return { ...IDENTITY_MATRIX };
  }

  let result = { ...IDENTITY_MATRIX };
  const re = /(matrix|translate|scale)\s*\(([^)]*)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(transform)) !== null) {
    const kind = match[1].toLowerCase();
    const nums = parseNumberList(match[2]);
    let next = { ...IDENTITY_MATRIX };

    if (kind === 'translate') {
      next = translateMatrix(nums[0] ?? 0, nums[1] ?? 0);
    } else if (kind === 'scale') {
      const sx = nums[0] ?? 1;
      const sy = nums[1] ?? sx;
      next = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
    } else if (kind === 'matrix' && nums.length >= 6) {
      next = { a: nums[0], b: nums[1], c: nums[2], d: nums[3], e: nums[4], f: nums[5] };
    }

    result = multiplyMatrix(result, next);
  }

  return result;
}

export function applyMatrixToPoint(
  m: AffineMatrix,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
  };
}

export function transformBBox(box: BBox, m: AffineMatrix): BBox {
  if (!isValidBBox(box)) return box;
  const corners = [
    applyMatrixToPoint(m, box.minX, box.minY),
    applyMatrixToPoint(m, box.maxX, box.minY),
    applyMatrixToPoint(m, box.minX, box.maxY),
    applyMatrixToPoint(m, box.maxX, box.maxY),
  ];
  return {
    minX: Math.min(...corners.map((p) => p.x)),
    minY: Math.min(...corners.map((p) => p.y)),
    maxX: Math.max(...corners.map((p) => p.x)),
    maxY: Math.max(...corners.map((p) => p.y)),
  };
}

function parseNum(value: string | null | undefined, fallback = 0): number {
  if (value == null || value === '') return fallback;
  const n = parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
}

function localBBoxFromPoints(points: string | null): BBox | null {
  if (!points?.trim()) return null;
  const nums = parseNumberList(points);
  if (nums.length < 2) return null;
  const box = emptyBBox();
  for (let i = 0; i + 1 < nums.length; i += 2) {
    box.minX = Math.min(box.minX, nums[i]);
    box.minY = Math.min(box.minY, nums[i + 1]);
    box.maxX = Math.max(box.maxX, nums[i]);
    box.maxY = Math.max(box.maxY, nums[i + 1]);
  }
  return isValidBBox(box) ? box : null;
}

const TWO_PI = Math.PI * 2;

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const n = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
  if (n === 0) return 0;
  const cos = Math.min(1, Math.max(-1, (ux * vx + uy * vy) / n));
  const ang = Math.acos(cos);
  return ux * vy - uy * vx < 0 ? -ang : ang;
}

function isThetaOnArc(theta: number, start: number, delta: number): boolean {
  const eps = 1e-6;
  let t = theta - start;
  if (delta >= 0) {
    while (t < 0) t += TWO_PI;
    while (t > TWO_PI) t -= TWO_PI;
    return t <= delta + eps;
  }
  while (t > 0) t -= TWO_PI;
  while (t < -TWO_PI) t += TWO_PI;
  return t >= delta - eps;
}

/**
 * SVG 椭圆弧端点参数 → 包围盒极值点（含端点）。
 * 仅用端点会漏掉弧凸出（饼图扇区被裁切的根因）。
 * @see https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
 */
export function includeEllipticalArcBBox(
  include: (px: number, py: number) => void,
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number,
): void {
  include(x1, y1);
  include(x2, y2);

  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) {
    return;
  }

  const phi = (phiDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArc !== sweep ? 1 : -1;
  let sq = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  sq = Math.max(0, sq);
  const coef = sign * Math.sqrt(sq);
  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const start = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = vectorAngle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && delta > 0) delta -= TWO_PI;
  if (sweep && delta < 0) delta += TWO_PI;

  const pointAt = (theta: number) => {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    include(
      cx + rx * cosT * cosPhi - ry * sinT * sinPhi,
      cy + rx * cosT * sinPhi + ry * sinT * cosPhi,
    );
  };

  // 旋转椭圆在 x/y 方向的极值参数角
  const tx = Math.atan2(-ry * sinPhi, rx * cosPhi);
  const ty = Math.atan2(ry * cosPhi, rx * sinPhi);
  for (const theta of [tx, tx + Math.PI, ty, ty + Math.PI]) {
    if (isThetaOnArc(theta, start, delta)) {
      pointAt(theta);
    }
  }
}

/** 解析 path d，用路径点/控制点/弧极值估计包围盒 */
export function estimatePathBBox(d: string | null | undefined): BBox | null {
  if (!d?.trim()) return null;

  const box = emptyBBox();
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const include = (px: number, py: number) => {
    box.minX = Math.min(box.minX, px);
    box.minY = Math.min(box.minY, py);
    box.maxX = Math.max(box.maxX, px);
    box.maxY = Math.max(box.maxY, py);
  };

  const tokens = d.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = '';

  const read = (): number => {
    const n = parseFloat(tokens[i] ?? '0');
    i += 1;
    return Number.isNaN(n) ? 0 : n;
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[a-zA-Z]$/.test(token)) {
      cmd = token;
      i += 1;
    } else if (!cmd) {
      i += 1;
      continue;
    }

    const abs = cmd === cmd.toUpperCase();
    const lower = cmd.toLowerCase();

    if (lower === 'm' || lower === 'l' || lower === 't') {
      const px = read();
      const py = read();
      x = abs ? px : x + px;
      y = abs ? py : y + py;
      if (lower === 'm') {
        startX = x;
        startY = y;
      }
      include(x, y);
    } else if (lower === 'h') {
      const px = read();
      x = abs ? px : x + px;
      include(x, y);
    } else if (lower === 'v') {
      const py = read();
      y = abs ? py : y + py;
      include(x, y);
    } else if (lower === 'z') {
      x = startX;
      y = startY;
      include(x, y);
    } else if (lower === 'c') {
      const x1 = abs ? read() : x + read();
      const y1 = abs ? read() : y + read();
      const x2 = abs ? read() : x + read();
      const y2 = abs ? read() : y + read();
      const x3 = abs ? read() : x + read();
      const y3 = abs ? read() : y + read();
      include(x1, y1);
      include(x2, y2);
      include(x3, y3);
      x = x3;
      y = y3;
    } else if (lower === 's' || lower === 'q') {
      const x1 = abs ? read() : x + read();
      const y1 = abs ? read() : y + read();
      const x2 = abs ? read() : x + read();
      const y2 = abs ? read() : y + read();
      include(x1, y1);
      include(x2, y2);
      x = x2;
      y = y2;
    } else if (lower === 'a') {
      const rx = read();
      const ry = read();
      const angle = read();
      const largeArc = read();
      const sweep = read();
      const px = read();
      const py = read();
      const nx = abs ? px : x + px;
      const ny = abs ? py : y + py;
      includeEllipticalArcBBox(include, x, y, rx, ry, angle, largeArc, sweep, nx, ny);
      x = nx;
      y = ny;
    } else {
      // 未知命令，跳过后续数字
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        i += 1;
      }
    }
  }

  return isValidBBox(box) ? box : null;
}

function localElementBBox(el: Element): BBox | null {
  const tag = el.tagName.toLowerCase();

  if (tag === 'rect' || tag === 'image' || tag === 'foreignobject') {
    const x = parseNum(el.getAttribute('x'));
    const y = parseNum(el.getAttribute('y'));
    const width = parseNum(el.getAttribute('width'));
    const height = parseNum(el.getAttribute('height'));
    if (width <= 0 && height <= 0) return null;
    return { minX: x, minY: y, maxX: x + Math.max(width, 0), maxY: y + Math.max(height, 0) };
  }

  if (tag === 'circle') {
    const cx = parseNum(el.getAttribute('cx'));
    const cy = parseNum(el.getAttribute('cy'));
    const r = parseNum(el.getAttribute('r'));
    return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
  }

  if (tag === 'ellipse') {
    const cx = parseNum(el.getAttribute('cx'));
    const cy = parseNum(el.getAttribute('cy'));
    const rx = parseNum(el.getAttribute('rx'));
    const ry = parseNum(el.getAttribute('ry'));
    return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry };
  }

  if (tag === 'line') {
    const x1 = parseNum(el.getAttribute('x1'));
    const y1 = parseNum(el.getAttribute('y1'));
    const x2 = parseNum(el.getAttribute('x2'));
    const y2 = parseNum(el.getAttribute('y2'));
    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
    };
  }

  if (tag === 'polyline' || tag === 'polygon') {
    return localBBoxFromPoints(el.getAttribute('points'));
  }

  if (tag === 'path') {
    return estimatePathBBox(el.getAttribute('d'));
  }

  if (tag === 'text' || tag === 'tspan') {
    const x = parseNum(el.getAttribute('x'));
    const y = parseNum(el.getAttribute('y'));
    const fontSize = parseNum(el.getAttribute('font-size'), 14);
    const textLen = (el.textContent ?? '').trim().length;
    const width = Math.max(textLen * fontSize * 0.65, fontSize);
    const height = fontSize * 1.2;
    return { minX: x, minY: y - height, maxX: x + width, maxY: y };
  }

  if (tag === 'use') {
    const x = parseNum(el.getAttribute('x'));
    const y = parseNum(el.getAttribute('y'));
    const width = parseNum(el.getAttribute('width'), 16);
    const height = parseNum(el.getAttribute('height'), 16);
    return { minX: x, minY: y, maxX: x + width, maxY: y + height };
  }

  return null;
}

function strokePadding(el: Element): number {
  const sw = parseNum(el.getAttribute('stroke-width'), 0);
  const stroke = el.getAttribute('stroke');
  const styleStroke = (el as SVGElement).style?.stroke;
  const hasStroke =
    (stroke && stroke !== 'none') ||
    (typeof styleStroke === 'string' && styleStroke !== '' && styleStroke !== 'none');

  if (!hasStroke && sw <= 0) {
    return 0;
  }

  // SVG 默认 stroke-width=1；描边以路径居中，需至少半宽。
  // 再多留 1px：拆成独立 deckNode 后 overflow:hidden 极易把 1px 高/宽的线裁没。
  const half = Math.max(sw > 0 ? sw : 1, 1) / 2;
  return half + 1;
}

/**
 * 计算元素在局部坐标系（含自身 transform）下的包围盒。
 * 不包含祖先 transform。
 */
export function estimateLocalBBox(el: Element, skipText = false): BBox | null {
  const tag = el.tagName.toLowerCase();
  if (tag === 'defs' || tag === 'style' || tag === 'script' || tag === 'title' || tag === 'desc') {
    return null;
  }
  if (skipText && (tag === 'text' || tag === 'tspan' || tag === 'foreignobject')) {
    return null;
  }

  let box = localElementBBox(el);
  if (tag === 'g' || tag === 'a' || tag === 'svg' || !box) {
    let union = emptyBBox();
    for (const child of Array.from(el.children)) {
      const childBox = estimateLocalBBox(child, skipText);
      if (childBox) {
        union = unionBBox(union, childBox);
      }
    }
    if (isValidBBox(union)) {
      box = box ? unionBBox(box, union) : union;
    }
  }

  if (!box || !isValidBBox(box)) {
    return null;
  }

  box = expandBBox(box, strokePadding(el));
  const selfMatrix = parseTransformMatrix(el.getAttribute('transform'));
  return transformBBox(box, selfMatrix);
}

/** 从 svg 根到该元素（含自身）的累计变换矩阵 */
export function getWorldMatrix(el: Element): AffineMatrix {
  const chain: Element[] = [];
  let current: Element | null = el;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'svg' && current !== el) {
      break;
    }
    chain.push(current);
    current = current.parentElement;
  }

  let matrix = { ...IDENTITY_MATRIX };
  for (const node of chain.reverse()) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'svg' && node !== el) {
      continue;
    }
    matrix = multiplyMatrix(matrix, parseTransformMatrix(node.getAttribute('transform')));
  }
  return matrix;
}

/**
 * 元素在根 SVG 用户坐标系下的包围盒。
 * @param skipText 为 true 时忽略 text/foreignObject（文本已单独提取）
 */
export function estimateWorldBBox(el: Element, skipText = false): BBox | null {
  // estimateLocalBBox 已含自身 transform；祖先 transform 需再乘
  const local = estimateLocalBBox(el, skipText);
  if (!local) return null;

  // local 已含自身 transform，故世界矩阵不含自身
  const ancestors: Element[] = [];
  let current = el.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'svg') break;
    ancestors.push(current);
    current = current.parentElement;
  }

  let matrix = { ...IDENTITY_MATRIX };
  for (const node of ancestors.reverse()) {
    matrix = multiplyMatrix(matrix, parseTransformMatrix(node.getAttribute('transform')));
  }

  return transformBBox(local, matrix);
}

/** 收集祖先 transform（不含自身），从外到内，用于包一层 g */
export function getAncestorTransformList(el: Element): string[] {
  const list: string[] = [];
  let current = el.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'svg') break;
    const transform = current.getAttribute('transform');
    if (transform?.trim()) {
      list.push(transform.trim());
    }
    current = current.parentElement;
  }
  return list.reverse();
}
