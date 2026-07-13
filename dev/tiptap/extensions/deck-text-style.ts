import { Mark, mergeAttributes } from '@tiptap/core';
import { DEFAULT_TEXT_STYLE_LINE_HEIGHT } from 'svg-to-deck-converter';

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
