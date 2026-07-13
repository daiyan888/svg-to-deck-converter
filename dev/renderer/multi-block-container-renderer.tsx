import type {
  MultiBlockContainerNode,
  ParagraphNode,
  TextNode,
  VerticalAlign,
} from 'svg-to-deck-converter';
import {
  DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
  DEFAULT_PARAGRAPH_TEXT_ALIGN,
  DEFAULT_TEXT_STYLE_LINE_HEIGHT,
  LINE_HEIGHT_RENDER_FACTOR,
} from 'svg-to-deck-converter';
import { buildTextColorCss } from '../tiptap/text-color-style';
import styles from './deck-renderer.module.css';

function resolveParagraphLineHeight(p: ParagraphNode): number {
  for (const text of p.content) {
    const mark = text.marks?.find((m) => m.type === 'textStyle');
    if (mark?.type === 'textStyle' && typeof mark.attrs.lineHeight === 'number') {
      return mark.attrs.lineHeight;
    }
  }
  return DEFAULT_TEXT_STYLE_LINE_HEIGHT;
}

function renderTextNode(node: TextNode, key: number) {
  const textStyleMark = node.marks?.find((m) => m.type === 'textStyle');
  const colorMark = node.marks?.find((m) => m.type === 'textGradientColor');
  const style = {
    ...(textStyleMark
      ? {
          fontFamily: textStyleMark.attrs.fontFamily,
          fontSize: textStyleMark.attrs.fontSize,
          lineHeight: 'var(--data-line-height)',
        }
      : {}),
    ...(colorMark
      ? buildTextColorCss({
          color: colorMark.attrs.color,
          textGradientColor: colorMark.attrs.textGradientColor,
        }) ?? {}
      : {}),
  };
  return (
    <span key={key} style={Object.keys(style).length > 0 ? style : undefined}>
      {node.text}
    </span>
  );
}

function renderParagraph(p: ParagraphNode, key: number) {
  const textAlign = p.attrs?.textAlign ?? DEFAULT_PARAGRAPH_TEXT_ALIGN;
  const lineHeight = resolveParagraphLineHeight(p);
  return (
    <p
      key={key}
      className={styles.paragraph}
      style={{
        textAlign,
        width: '100%',
        ['--data-line-height' as string]: lineHeight * LINE_HEIGHT_RENDER_FACTOR,
      }}
    >
      {p.content.map((t, i) => renderTextNode(t, i))}
    </p>
  );
}

interface MultiBlockContainerRendererProps {
  node: MultiBlockContainerNode;
}

export function MultiBlockContainerRenderer({ node }: MultiBlockContainerRendererProps) {
  const padding = node.attrs.padding;
  const verticalAlign: VerticalAlign =
    node.attrs.verticalAlign ?? DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN;

  return (
    <div
      className={styles.multiBlockContainer}
      style={{
        padding,
        alignItems: verticalAlign,
        alignContent: verticalAlign,
      }}
    >
      {node.content.map((p, i) => renderParagraph(p, i))}
    </div>
  );
}
