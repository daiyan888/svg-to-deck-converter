import { collectElementProps } from './attribute-utils.js';
import { isSkippableRoot, isTextElement, resolveComp } from './svg-tags.js';
import type { CommandsItem } from '../types/deck.js';

export interface CommandConvertContext {
  skippedNodes: string[];
  commandCount: number;
  skipForeignObject?: boolean;
}

function getElementChildren(el: Element): Element[] {
  return Array.from(el.childNodes).filter(
    (node): node is Element => node.nodeType === Node.ELEMENT_NODE,
  );
}

function elementToCommand(el: Element, ctx: CommandConvertContext): CommandsItem | null {
  const tag = el.tagName.toLowerCase();
  if (isSkippableRoot(tag) || isTextElement(tag)) {
    return null;
  }
  if (ctx.skipForeignObject && tag === 'foreignobject') {
    return null;
  }

  const elementChildren = getElementChildren(el).filter((child) => !isTextElement(child.tagName));
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

  return {
    comp,
    props,
    ...(children.length > 0 ? { children } : {}),
  };
}

export function svgElementToCommands(
  svgRoot: SVGSVGElement,
  ctx: CommandConvertContext,
): CommandsItem[] {
  const commands: CommandsItem[] = [];
  for (const child of getElementChildren(svgRoot)) {
    if (isTextElement(child.tagName)) {
      continue;
    }
    const item = elementToCommand(child, ctx);
    if (item) {
      commands.push(item);
    }
  }
  return commands;
}
