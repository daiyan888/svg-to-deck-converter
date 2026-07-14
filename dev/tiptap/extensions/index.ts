import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import {
  DEFAULT_PARAGRAPH_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_TEXT_ALIGN,
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

function parseTextAlign(raw: string | null): TextAlign {
  if (raw && TEXT_ALIGNS.has(raw as TextAlign)) {
    return raw as TextAlign;
  }
  return DEFAULT_PARAGRAPH_TEXT_ALIGN;
}

function parseLineHeight(raw: string | null): number {
  if (!raw) {
    return DEFAULT_PARAGRAPH_LINE_HEIGHT;
  }
  const n = parseFloat(raw);
  return Number.isNaN(n) ? DEFAULT_PARAGRAPH_LINE_HEIGHT : n;
}

const StyledParagraph = Paragraph.extend({
  addAttributes() {
    return {
      textAlign: {
        default: DEFAULT_PARAGRAPH_TEXT_ALIGN,
        parseHTML: (element) => parseTextAlign(element.style.textAlign || null),
        renderHTML: () => ({}),
      },
      lineHeight: {
        default: DEFAULT_PARAGRAPH_LINE_HEIGHT,
        parseHTML: (element) => {
          const fromVar = element.style.getPropertyValue('--data-line-height').trim();
          if (fromVar) {
            const cssLineHeight = parseFloat(fromVar);
            if (!Number.isNaN(cssLineHeight)) {
              return cssLineHeight / LINE_HEIGHT_RENDER_FACTOR;
            }
          }
          return parseLineHeight(element.getAttribute('data-line-height'));
        },
        renderHTML: () => ({}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const textAlign = (node.attrs.textAlign as TextAlign) ?? DEFAULT_PARAGRAPH_TEXT_ALIGN;
    const lineHeight =
      typeof node.attrs.lineHeight === 'number'
        ? node.attrs.lineHeight
        : DEFAULT_PARAGRAPH_LINE_HEIGHT;
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
