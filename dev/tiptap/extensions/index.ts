import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  DEFAULT_TEXT_STYLE_LINE_HEIGHT,
  DEFAULT_TEXT_STYLE_TEXT_ALIGN,
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

function resolveTextStyleAttr<T>(
  node: ProseMirrorNode,
  key: 'lineHeight' | 'textAlign',
  fallback: T,
): T {
  let value = fallback;
  let found = false;
  node.forEach((child) => {
    if (found) {
      return;
    }
    const mark = child.marks.find((m) => m.type.name === 'textStyle');
    if (mark && mark.attrs[key] != null) {
      value = mark.attrs[key] as T;
      found = true;
    }
  });
  return value;
}

const StyledParagraph = Paragraph.extend({
  renderHTML({ node, HTMLAttributes }) {
    const lineHeight = resolveTextStyleAttr(
      node,
      'lineHeight',
      DEFAULT_TEXT_STYLE_LINE_HEIGHT,
    );
    const textAlign = resolveTextStyleAttr<TextAlign>(
      node,
      'textAlign',
      DEFAULT_TEXT_STYLE_TEXT_ALIGN,
    );
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
