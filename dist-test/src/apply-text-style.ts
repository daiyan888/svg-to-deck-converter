import type {
  DeckDocument,
  DeckNode,
  MultiBlockContainerNode,
  TextMark,
  TextNode,
} from '../../dist/browser/index.js';

export interface TextStyleOverride {
  fontSize?: string;
  color?: string;
}

export interface SampledTextStyle {
  fontSize: string | null;
  color: string | null;
  hasText: boolean;
}

function applyOverridesToMarks(
  marks: TextMark[] | undefined,
  overrides: TextStyleOverride,
): TextMark[] {
  const next: TextMark[] = marks ? [...marks] : [];

  if (overrides.fontSize) {
    const idx = next.findIndex((m) => m.type === 'textStyle');
    if (idx >= 0) {
      const mark = next[idx];
      if (mark.type === 'textStyle') {
        next[idx] = {
          type: 'textStyle',
          attrs: { ...mark.attrs, fontSize: overrides.fontSize },
        };
      }
    } else {
      next.push({
        type: 'textStyle',
        attrs: {
          fontFamily: 'sans-serif',
          fontSize: overrides.fontSize,
        },
      });
    }
  }

  if (overrides.color) {
    const idx = next.findIndex((m) => m.type === 'textGradientColor');
    if (idx >= 0) {
      next[idx] = {
        type: 'textGradientColor',
        attrs: { color: overrides.color, textGradientColor: null },
      };
    } else {
      next.push({
        type: 'textGradientColor',
        attrs: { color: overrides.color, textGradientColor: null },
      });
    }
  }

  return next;
}

function mapTextNode(node: TextNode, overrides: TextStyleOverride): TextNode {
  return {
    ...node,
    marks: applyOverridesToMarks(node.marks, overrides),
  };
}

function mapMultiBlock(
  node: MultiBlockContainerNode,
  overrides: TextStyleOverride,
): MultiBlockContainerNode {
  return {
    ...node,
    content: node.content.map((paragraph) => ({
      ...paragraph,
      content: paragraph.content.map((text) => mapTextNode(text, overrides)),
    })),
  };
}

function mapDeckNode(node: DeckNode, overrides: TextStyleOverride): DeckNode {
  const child = node.content[0];
  if (!child || child.type !== 'multiBlockContainer') {
    return node;
  }
  return {
    ...node,
    content: [mapMultiBlock(child, overrides)],
  };
}

export function withTextStyleOverrides(
  document: DeckDocument,
  overrides: TextStyleOverride,
): DeckDocument {
  if (!overrides.fontSize && !overrides.color) {
    return document;
  }
  return {
    ...document,
    content: document.content.map((node) => mapDeckNode(node, overrides)),
  };
}

export function sampleTextStyle(document: DeckDocument | null | undefined): SampledTextStyle {
  if (!document) {
    return { fontSize: null, color: null, hasText: false };
  }
  for (const deckNode of document.content) {
    const child = deckNode.content[0];
    if (!child || child.type !== 'multiBlockContainer') {
      continue;
    }
    for (const paragraph of child.content) {
      for (const text of paragraph.content) {
        const textStyle = text.marks?.find((m) => m.type === 'textStyle');
        const colorMark = text.marks?.find((m) => m.type === 'textGradientColor');
        return {
          hasText: true,
          fontSize: textStyle?.type === 'textStyle' ? textStyle.attrs.fontSize : null,
          color:
            colorMark?.type === 'textGradientColor'
              ? colorMark.attrs.color ?? colorMark.attrs.textGradientColor
              : null,
        };
      }
    }
  }
  return { fontSize: null, color: null, hasText: false };
}
