import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  DEFAULT_PARAGRAPH_TEXT_ALIGN,
  DEFAULT_TEXT_STYLE_LINE_HEIGHT,
  LINE_HEIGHT_RENDER_FACTOR,
  type TextAlign,
} from 'svg-to-deck-converter';
import { Deck } from './deck';
import { DeckDocument } from './deck-document';
import { DeckNode } from './deck-node';
import { DeckTextStyle } from './deck-text-style';
import { TextGradientColor } from './text-gradient-color';
import { MultiBlockContainer } from './multi-block-container';
import { SvgNode } from './svg-node';

const TEXT_ALIGNS = new Set<TextAlign>(['left', 'center', 'right', 'justify']);

function resolveParagraphLineHeight(node: ProseMirrorNode): number {
  let lineHeight = DEFAULT_TEXT_STYLE_LINE_HEIGHT;
  let found = false;
  node.forEach((child) => {
    if (found) {
      return;
    }
    const mark = child.marks.find((m) => m.type.name === 'textStyle');
    if (mark && typeof mark.attrs.lineHeight === 'number') {
      lineHeight = mark.attrs.lineHeight;
      found = true;
    }
  });
  return lineHeight;
}

function parseTextAlign(raw: string | null): TextAlign {
  if (raw && TEXT_ALIGNS.has(raw as TextAlign)) {
    return raw as TextAlign;
  }
  return DEFAULT_PARAGRAPH_TEXT_ALIGN;
}

const StyledParagraph = Paragraph.extend({
  addAttributes() {
    return {
      textAlign: {
        default: DEFAULT_PARAGRAPH_TEXT_ALIGN,
        parseHTML: (element) => parseTextAlign(element.style.textAlign || null),
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const textAlign = (node.attrs.textAlign as TextAlign) ?? DEFAULT_PARAGRAPH_TEXT_ALIGN;
    const lineHeight = resolveParagraphLineHeight(node);
    const dataLineHeight = lineHeight * LINE_HEIGHT_RENDER_FACTOR;
    return [
      'p',
      {
        ...HTMLAttributes,
        style: `margin:0;width:100%;line-height:0;--data-line-height:${dataLineHeight};text-align:${textAlign};`,
      },
      0,
    ];
  },
});

export const deckExtensions = [
  DeckDocument,
  Deck,
  DeckNode,
  SvgNode,
  MultiBlockContainer,
  StyledParagraph,
  Text,
  DeckTextStyle,
  TextGradientColor,
];
