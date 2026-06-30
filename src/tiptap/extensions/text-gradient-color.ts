import { Mark, mergeAttributes } from '@tiptap/core';
import { buildTextColorStyleString } from '../text-color-style';

export const TextGradientColor = Mark.create({
  name: 'textGradientColor',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => (attributes.color ? { color: attributes.color } : {}),
      },
      textGradientColor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-text-gradient') || null,
        renderHTML: (attributes) =>
          attributes.textGradientColor
            ? { 'data-text-gradient': attributes.textGradientColor }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-text-gradient-color]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { color, textGradientColor, ...rest } = HTMLAttributes;
    const colorStyle = buildTextColorStyleString({ color, textGradientColor });
    return [
      'span',
      mergeAttributes(rest, {
        'data-text-gradient-color': '',
        ...(textGradientColor ? { 'data-text-gradient': textGradientColor } : {}),
        ...(colorStyle ? { style: colorStyle } : {}),
      }),
      0,
    ];
  },
});
