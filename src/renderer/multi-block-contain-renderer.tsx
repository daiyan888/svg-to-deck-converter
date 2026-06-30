import type { MultiBlockContainNode, ParagraphNode, TextNode } from '../types/deck';
import { buildTextColorCss } from '../tiptap/text-color-style';
import styles from './deck-renderer.module.css';

function renderTextNode(node: TextNode, key: number) {
  const textStyleMark = node.marks?.find((m) => m.type === 'textStyle');
  const colorMark = node.marks?.find((m) => m.type === 'textGradientColor');
  const style = {
    ...(textStyleMark
      ? {
          fontFamily: textStyleMark.attrs.fontFamily,
          fontSize: `${textStyleMark.attrs.fontSize}px`,
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
  const textAlign = p.attrs?.textAlign;
  return (
    <p
      key={key}
      className={styles.paragraph}
      style={textAlign ? { textAlign } : undefined}
    >
      {p.content.map((t, i) => renderTextNode(t, i))}
    </p>
  );
}

interface MultiBlockContainRendererProps {
  node: MultiBlockContainNode;
}

export function MultiBlockContainRenderer({ node }: MultiBlockContainRendererProps) {
  return (
    <div className={styles.multiBlockContain}>
      {node.content.map((p, i) => renderParagraph(p, i))}
    </div>
  );
}
