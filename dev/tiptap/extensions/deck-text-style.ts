import { Mark, mergeAttributes } from '@tiptap/core';

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
        default: 14,
        parseHTML: (element) => {
          const size = element.style.fontSize;
          return size ? parseFloat(size) : 14;
        },
        renderHTML: (attributes) => ({ fontSize: attributes.fontSize }),
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
        style: `font-family:${fontFamily};font-size:${fontSize}px;`,
      }),
      0,
    ];
  },
});
