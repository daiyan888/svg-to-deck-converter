import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Deck } from './deck';
import { DeckDocument } from './deck-document';
import { DeckNode } from './deck-node';
import { DeckTextStyle } from './deck-text-style';
import { TextGradientColor } from './text-gradient-color';
import { MultiBlockContainer } from './multi-block-container';
import { SvgNode } from './svg-node';

const StyledParagraph = Paragraph.extend({
  addAttributes() {
    return {
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null,
        renderHTML: (attributes) => {
          if (!attributes.textAlign) {
            return {};
          }
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const textAlign = node.attrs.textAlign as string | null;
    const alignStyle = textAlign ? `text-align:${textAlign};` : '';
    return ['p', { ...HTMLAttributes, style: `margin:0;line-height:1.2;${alignStyle}` }, 0];
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
