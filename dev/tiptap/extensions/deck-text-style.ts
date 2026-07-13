import { Mark, mergeAttributes } from '@tiptap/core';
import {
  DEFAULT_TEXT_STYLE_LINE_HEIGHT,
  DEFAULT_TEXT_STYLE_TEXT_ALIGN,
  type TextAlign,
} from 'svg-to-deck-converter';

const TEXT_ALIGNS = new Set<TextAlign>(['left', 'center', 'right', 'justify']);

function parseTextAlignAttr(raw: string | null): TextAlign {
  if (raw && TEXT_ALIGNS.has(raw as TextAlign)) {
    return raw as TextAlign;
  }
  return DEFAULT_TEXT_STYLE_TEXT_ALIGN;
}

export const DeckTextStyle = Mark.create({
  name: 'textStyle',

  addAttributes() {
    return {
      fontFamily: {
        default: 'sans-serif',
        parseHTML: (element) => element.style.fontFamily || 'sans-serif',
        renderHTML: (attributes) => ({ fontFamily: attributes.fontFamily }),
      },
      fontSize: {
        default: '14px',
        parseHTML: (element) => element.style.fontSize || '10.5pt',
        renderHTML: (attributes) => ({ fontSize: attributes.fontSize }),
      },
      lineHeight: {
        default: DEFAULT_TEXT_STYLE_LINE_HEIGHT,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-line-height');
          if (!raw) {
            return DEFAULT_TEXT_STYLE_LINE_HEIGHT;
          }
          const n = parseFloat(raw);
          return Number.isNaN(n) ? DEFAULT_TEXT_STYLE_LINE_HEIGHT : n;
        },
        renderHTML: (attributes) => ({
          'data-line-height': String(attributes.lineHeight ?? DEFAULT_TEXT_STYLE_LINE_HEIGHT),
        }),
      },
      textAlign: {
        default: DEFAULT_TEXT_STYLE_TEXT_ALIGN,
        parseHTML: (element) =>
          parseTextAlignAttr(
            element.getAttribute('data-text-align') || element.style.textAlign || null,
          ),
        renderHTML: (attributes) => ({
          'data-text-align': String(attributes.textAlign ?? DEFAULT_TEXT_STYLE_TEXT_ALIGN),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-text-style]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { fontFamily, fontSize } = HTMLAttributes;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-text-style': '',
        style: `font-family:${fontFamily};font-size:${fontSize};line-height:var(--data-line-height);`,
      }),
      0,
    ];
  },
});
