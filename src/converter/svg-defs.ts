import type { CommandsItem } from '../types/deck.js';
import { elementToCommand, type CommandConvertContext } from './svg-to-commands.js';

const URL_REF_RE = /url\(\s*['"]?#([^)'"]+)['"]?\s*\)/gi;
const HASH_REF_RE = /^#(.+)$/;

/** 从属性值中提取 id 引用（url(#id) / #id） */
export function extractIdRefsFromValue(value: string): string[] {
  const ids: string[] = [];
  URL_REF_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_REF_RE.exec(value)) !== null) {
    ids.push(match[1]);
  }
  const hash = value.trim().match(HASH_REF_RE);
  if (hash) {
    ids.push(hash[1]);
  }
  return ids;
}

function collectRefsFromElement(el: Element, into: Set<string>): void {
  for (const attr of Array.from(el.attributes)) {
    for (const id of extractIdRefsFromValue(attr.value)) {
      into.add(id);
    }
  }
  for (const child of Array.from(el.children)) {
    collectRefsFromElement(child, into);
  }
}

function collectRefsFromCommands(item: CommandsItem, into: Set<string>): void {
  for (const [key, value] of Object.entries(item)) {
    if (key === 'comp' || key === 'children') continue;
    if (typeof value === 'string') {
      for (const id of extractIdRefsFromValue(value)) {
        into.add(id);
      }
    }
  }
  if (typeof item.innerHTML === 'string') {
    for (const id of extractIdRefsFromValue(item.innerHTML)) {
      into.add(id);
    }
  }
  if (item.children) {
    for (const child of item.children) {
      collectRefsFromCommands(child, into);
    }
  }
}

export function buildDefsIndex(svgRoot: SVGSVGElement): Map<string, Element> {
  const index = new Map<string, Element>();
  for (const el of Array.from(svgRoot.querySelectorAll('[id]'))) {
    const id = el.getAttribute('id');
    if (id) {
      index.set(id, el);
    }
  }
  return index;
}

/**
 * 收集元素（及其子树）引用到的 defs id，并做传递闭包
 * （例如 filter 内部再引用 gradient）。
 */
export function collectReferencedDefIds(
  el: Element,
  defsIndex: Map<string, Element>,
): Set<string> {
  const direct = new Set<string>();
  collectRefsFromElement(el, direct);

  const resolved = new Set<string>();
  const queue = [...direct];

  while (queue.length > 0) {
    const id = queue.pop()!;
    if (resolved.has(id)) continue;
    const defEl = defsIndex.get(id);
    if (!defEl) continue;
    resolved.add(id);
    const nested = new Set<string>();
    collectRefsFromElement(defEl, nested);
    for (const nestedId of nested) {
      if (!resolved.has(nestedId)) {
        queue.push(nestedId);
      }
    }
  }

  return resolved;
}

export function collectReferencedDefIdsFromCommands(
  commands: CommandsItem[],
  defsIndex: Map<string, Element>,
): Set<string> {
  const direct = new Set<string>();
  for (const cmd of commands) {
    collectRefsFromCommands(cmd, direct);
  }

  const resolved = new Set<string>();
  const queue = [...direct];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (resolved.has(id)) continue;
    const defEl = defsIndex.get(id);
    if (!defEl) continue;
    resolved.add(id);
    const nested = new Set<string>();
    collectRefsFromElement(defEl, nested);
    for (const nestedId of nested) {
      if (!resolved.has(nestedId)) {
        queue.push(nestedId);
      }
    }
  }
  return resolved;
}

function rewriteIdRefsInValue(value: string, idMap: Map<string, string>): string {
  const urlRe = /url\(\s*['"]?#([^)'"]+)['"]?\s*\)/gi;
  let next = value.replace(urlRe, (_full, id: string) => {
    const mapped = idMap.get(id);
    return mapped ? `url(#${mapped})` : `url(#${id})`;
  });
  const trimmed = next.trim();
  const hash = trimmed.match(HASH_REF_RE);
  if (hash && trimmed === `#${hash[1]}`) {
    const mapped = idMap.get(hash[1]);
    if (mapped) {
      next = `#${mapped}`;
    }
  }
  return next;
}

function rewriteCommandIds(item: CommandsItem, idMap: Map<string, string>): CommandsItem {
  const next: CommandsItem = { comp: item.comp };
  for (const [key, value] of Object.entries(item)) {
    if (key === 'comp') continue;
    if (key === 'children' && Array.isArray(value)) {
      next.children = (value as CommandsItem[]).map((child) => rewriteCommandIds(child, idMap));
      continue;
    }
    if (key === 'id' && typeof value === 'string' && idMap.has(value)) {
      next.id = idMap.get(value)!;
      continue;
    }
    if (typeof value === 'string') {
      next[key] = rewriteIdRefsInValue(value, idMap);
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      next[key] = value;
    }
  }
  return next;
}

/**
 * AntV 部分渐变 id 字面量带 `#`（如 id="#1783ff-badge"，fill="url(##1783ff-badge)"）。
 * `#` 在 HTML 内嵌 SVG 的 id / url(#…) 中不合法，会导致填充失败并出现灰块占位。
 */
export function sanitizeDefId(id: string): string {
  return id.replace(/#/g, '');
}

/**
 * 将引用到的 defs 转为带唯一 id 前缀的 local defs command，
 * 并返回用于改写图形命令引用的 idMap。
 */
export function buildLocalDefsCommand(
  referencedIds: Set<string>,
  defsIndex: Map<string, Element>,
  idPrefix: string,
  ctx: CommandConvertContext,
): { defsCommand: CommandsItem | null; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  for (const id of referencedIds) {
    if (defsIndex.has(id)) {
      idMap.set(id, `${idPrefix}${sanitizeDefId(id)}`);
    }
  }

  if (idMap.size === 0) {
    return { defsCommand: null, idMap };
  }

  const children: CommandsItem[] = [];
  for (const [oldId, newId] of idMap) {
    const el = defsIndex.get(oldId);
    if (!el) continue;

    // 只拷贝 defs 的直接子定义节点；若引用的是 defs 外的 symbol 等，也整节点拷贝
    const cmd = elementToCommand(el, {
      ...ctx,
      skipForeignObject: false,
      skipTextElements: false,
    });
    if (!cmd) continue;

    const rewritten = rewriteCommandIds(cmd, idMap);
    rewritten.id = newId;
    children.push(rewritten);
  }

  if (children.length === 0) {
    return { defsCommand: null, idMap };
  }

  return {
    defsCommand: {
      comp: 'defs',
      children,
    },
    idMap,
  };
}

/** 用 idMap 改写图形 commands 中的 url(#id) / #id / id */
export function rewriteCommandsIds(
  commands: CommandsItem[],
  idMap: Map<string, string>,
): CommandsItem[] {
  if (idMap.size === 0) return commands;
  return commands.map((cmd) => rewriteCommandIds(cmd, idMap));
}

/**
 * 估算 filter 阴影需要的额外 bbox padding（像素）。
 */
export function estimateFilterPadding(
  el: Element,
  defsIndex: Map<string, Element>,
): number {
  const refs = new Set<string>();
  collectRefsFromElement(el, refs);
  let padding = 0;

  for (const id of refs) {
    const defEl = defsIndex.get(id);
    if (!defEl || defEl.tagName.toLowerCase() !== 'filter') continue;

    for (const fe of Array.from(defEl.querySelectorAll('*'))) {
      const tag = fe.tagName.toLowerCase();
      if (tag === 'fedropshadow' || tag === 'fegaussianblur') {
        const std = parseFloat(fe.getAttribute('stdDeviation') ?? '0');
        const dx = Math.abs(parseFloat(fe.getAttribute('dx') ?? '0'));
        const dy = Math.abs(parseFloat(fe.getAttribute('dy') ?? '0'));
        const blur = Number.isNaN(std) ? 0 : std * 3;
        padding = Math.max(
          padding,
          (Number.isNaN(dx) ? 0 : dx) + blur,
          (Number.isNaN(dy) ? 0 : dy) + blur,
        );
      }
    }

    // filter region 百分比时给一个保守兜底
    const x = defEl.getAttribute('x');
    if (x?.includes('%')) {
      padding = Math.max(padding, 8);
    }
  }

  return padding;
}
