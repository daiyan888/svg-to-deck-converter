import type {
  CommandsItem,
  DeckDocument,
  DeckNode,
  DeckNodeChild,
  MultiBlockContainerNode,
  ThemeColorSlot,
} from '../types/deck.js';
import { normalizeColor, normalizeColorHex } from './color-normalize.js';
import { isThemeColorSlot } from './deck-theme.js';

const COLOR_ATTRS = new Set([
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'color',
]);

/** 仅映射不透明色；半透明保留字面量，避免丢失 alpha */
const MIN_OPAQUE_ALPHA = 0.999;

export type ColorSlotLookup = Map<string, ThemeColorSlot> | Record<string, ThemeColorSlot>;

function lookupSlot(hex: string, lookup: ColorSlotLookup): ThemeColorSlot | undefined {
  if (lookup instanceof Map) {
    return lookup.get(hex);
  }
  const direct = lookup[hex] ?? lookup[hex.toLowerCase()];
  if (direct) {
    return direct;
  }
  for (const [key, slot] of Object.entries(lookup)) {
    if (normalizeColorHex(key) === hex) {
      return slot;
    }
  }
  return undefined;
}

/** 将单个颜色值映射为色槽；无法映射则原样返回 */
export function mapColorToSlot(value: string, lookup: ColorSlotLookup): string {
  const trimmed = value.trim();
  if (!trimmed || isThemeColorSlot(trimmed)) {
    return trimmed;
  }

  const normalized = normalizeColor(trimmed);
  if (!normalized || normalized.alpha < MIN_OPAQUE_ALPHA) {
    return value;
  }

  return lookupSlot(normalized.hex, lookup) ?? value;
}

/**
 * 替换字符串中的颜色字面量（用于 CSS gradient）。
 * 匹配 #hex / rgb() / rgba()。
 */
export function mapColorsInCssValue(value: string, lookup: ColorSlotLookup): string {
  if (!value || isThemeColorSlot(value.trim())) {
    return value;
  }

  return value.replace(
    /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]+\)/g,
    (match) => mapColorToSlot(match, lookup),
  );
}

function tokenizeCommand(item: CommandsItem, lookup: ColorSlotLookup): CommandsItem {
  const next: CommandsItem = { ...item };

  for (const [key, raw] of Object.entries(item)) {
    if (key === 'comp' || key === 'children' || key === 'innerHTML') {
      continue;
    }
    if (typeof raw !== 'string') {
      continue;
    }
    if (COLOR_ATTRS.has(key)) {
      next[key] = mapColorToSlot(raw, lookup);
    }
  }

  if (Array.isArray(item.children)) {
    next.children = item.children.map((child) => tokenizeCommand(child, lookup));
  }

  return next;
}

function tokenizeMultiBlock(
  node: MultiBlockContainerNode,
  lookup: ColorSlotLookup,
): MultiBlockContainerNode {
  return {
    ...node,
    content: node.content.map((paragraph) => ({
      ...paragraph,
      content: paragraph.content.map((textNode) => {
        if (!textNode.marks?.length) {
          return textNode;
        }
        return {
          ...textNode,
          marks: textNode.marks.map((mark) => {
            if (mark.type !== 'textGradientColor') {
              return mark;
            }
            return {
              ...mark,
              attrs: {
                color:
                  mark.attrs.color != null
                    ? mapColorToSlot(mark.attrs.color, lookup)
                    : mark.attrs.color,
                textGradientColor:
                  mark.attrs.textGradientColor != null
                    ? mapColorsInCssValue(mark.attrs.textGradientColor, lookup)
                    : mark.attrs.textGradientColor,
              },
            };
          }),
        };
      }),
    })),
  };
}

function tokenizeDeckNodeChild(child: DeckNodeChild, lookup: ColorSlotLookup): DeckNodeChild {
  if (child.type === 'svg') {
    return {
      ...child,
      attrs: {
        ...child.attrs,
        commands: child.attrs.commands.map((cmd) => tokenizeCommand(cmd, lookup)),
      },
    };
  }
  return tokenizeMultiBlock(child, lookup);
}

function tokenizeDeckNode(node: DeckNode, lookup: ColorSlotLookup): DeckNode {
  return {
    ...node,
    content: [tokenizeDeckNodeChild(node.content[0], lookup)],
  };
}

/** 将 deck 文档中的颜色字面量替换为主题色槽 */
export function tokenizeDeckDocumentColors(
  document: DeckDocument,
  lookup: ColorSlotLookup,
): DeckDocument {
  return {
    ...document,
    content: document.content.map((node) => tokenizeDeckNode(node, lookup)),
  };
}
