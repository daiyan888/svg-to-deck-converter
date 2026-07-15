import { collectElementProps } from './attribute-utils.js';
import { isAntvEditorChrome, isSkippableRoot, isTextElement, resolveComp } from './svg-tags.js';
import type { CommandsItem } from '../types/deck.js';

export interface CommandConvertContext {
  skippedNodes: string[];
  commandCount: number;
  /** 为 true 时跳过 foreignObject（文本已提取为 multiBlockContainer） */
  skipForeignObject?: boolean;
  /** 为 true 时跳过 text/tspan（文本已提取为 multiBlockContainer） */
  skipTextElements?: boolean;
}

function getElementChildren(el: Element): Element[] {
  return Array.from(el.childNodes).filter(
    (node): node is Element => node.nodeType === Node.ELEMENT_NODE,
  );
}

/** 序列化子节点，保留 text / foreignObject 内的原始 markup 与文本 */
function serializeChildNodes(el: Element): string {
  return Array.from(el.childNodes)
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).outerHTML;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? '';
      }
      return '';
    })
    .join('');
}

function elementWithPreservedContent(el: Element, comp: string): CommandsItem {
  const props = collectElementProps(el);
  const innerHTML = serializeChildNodes(el);
  return {
    comp,
    ...props,
    ...(innerHTML ? { innerHTML } : {}),
  };
}

export function elementToCommand(el: Element, ctx: CommandConvertContext): CommandsItem | null {
  const tag = el.tagName.toLowerCase();
  if (isSkippableRoot(tag)) {
    return null;
  }
  if (isAntvEditorChrome(el)) {
    return null;
  }

  if (isTextElement(tag)) {
    if (ctx.skipTextElements) {
      return null;
    }
    ctx.commandCount += 1;
    return elementWithPreservedContent(el, resolveComp(tag, el.childElementCount > 0));
  }

  if (tag === 'foreignobject') {
    if (ctx.skipForeignObject) {
      return null;
    }
    // HTML 子树不能按 SVG comp 规则转换，否则会变成无文本的 path
    ctx.commandCount += 1;
    return elementWithPreservedContent(el, 'foreignObject');
  }

  const elementChildren = getElementChildren(el).filter((child) => {
    if (isTextElement(child.tagName)) {
      return !ctx.skipTextElements;
    }
    return true;
  });
  const comp = resolveComp(tag, elementChildren.length > 0);
  const props = collectElementProps(el);

  if (comp === 'path' && tag !== 'path' && !props.d) {
    ctx.skippedNodes.push(`<${tag}> → 无 d 属性，已映射为 path`);
  }

  const children: CommandsItem[] = [];
  for (const child of elementChildren) {
    const item = elementToCommand(child, ctx);
    if (item) {
      children.push(item);
      ctx.commandCount += 1;
    }
  }

  ctx.commandCount += 1;

  const command: CommandsItem = {
    comp,
    ...props,
    ...(children.length > 0 ? { children } : {}),
  };

  // AntV 线状 path 常只写 stroke、不写 fill；SVG 默认 fill=black。
  // 独立渲染时补 fill=none，并补默认 strokeWidth，避免线看起来「消失」。
  normalizeStrokeLineArt(command, tag, props);
  scrubAntvGeometryProps(command, tag);

  return command;
}

/**
 * AntV 会在 path/ellipse 等上塞 width/height（饼盘 280×280 等元数据），
 * 写入独立 svg deckNode 后，部分环境下会表现为莫名小方块/占位盒。
 */
function scrubAntvGeometryProps(command: CommandsItem, tag: string): void {
  if (
    tag === 'path' ||
    tag === 'line' ||
    tag === 'polyline' ||
    tag === 'polygon'
  ) {
    delete command.width;
    delete command.height;
    delete command.x;
    delete command.y;
  }
  if (tag === 'circle' || tag === 'ellipse') {
    delete command.width;
    delete command.height;
    if (command.cx !== undefined || command.cy !== undefined) {
      delete command.x;
      delete command.y;
    }
  }
  if (command.strokeDasharray === '') {
    delete command.strokeDasharray;
  }
}

/** 描边线艺：无 fill 时显式 none；无 strokeWidth 时补 1 */
function normalizeStrokeLineArt(
  command: CommandsItem,
  tag: string,
  props: Record<string, string | number | boolean>,
): void {
  const isLineTag = tag === 'path' || tag === 'line' || tag === 'polyline';
  if (!isLineTag) return;

  const stroke = props.stroke;
  if (typeof stroke !== 'string' || stroke === '' || stroke === 'none') {
    return;
  }

  const fill = props.fill;
  if (fill === undefined || fill === null || fill === '') {
    command.fill = 'none';
  }

  if (props.strokeWidth === undefined && props['stroke-width'] === undefined) {
    command.strokeWidth = 1;
  }
}

export function svgElementToCommands(
  svgRoot: SVGSVGElement,
  ctx: CommandConvertContext,
): CommandsItem[] {
  const commands: CommandsItem[] = [];
  for (const child of getElementChildren(svgRoot)) {
    if (isTextElement(child.tagName) && ctx.skipTextElements) {
      continue;
    }
    const item = elementToCommand(child, ctx);
    if (item) {
      commands.push(item);
    }
  }
  return commands;
}
