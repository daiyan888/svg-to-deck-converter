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
        default: '14px',
        parseHTML: (element) => element.style.fontSize || '10.5pt',
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
        style: `font-family:${fontFamily};font-size:${fontSize};line-height:var(--data-line-height);`,
      }),
      0,
    ];
  },
});
