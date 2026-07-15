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
    // 多词字体名在 CSS 字符串里需要引号；attrs 里存的是裸名
    const cssFontFamily =
      typeof fontFamily === 'string' && /\s/.test(fontFamily) && !/^['"]/.test(fontFamily)
        ? `"${fontFamily.replace(/"/g, '')}"`
        : fontFamily;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-text-style': '',
        style: `font-family:${cssFontFamily};font-size:${fontSize};line-height:var(--data-line-height);`,
      }),
      0,
    ];
  },
});