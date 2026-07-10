import { EditorContent, useEditor } from '@tiptap/react';
import { useEffect, useMemo, type CSSProperties } from 'react';
import { toThemeCssValue, type DeckDocument, type DeckTheme } from 'svg-to-deck-converter';
import type { TextStyleOverride } from '../text-style/apply-text-style';
import { DeckPreviewClrSchemeContext } from './extensions/deck';
import { deckExtensions } from './extensions';
import { toTiptapDoc } from './to-tiptap-doc';
import styles from './deck-editor.module.css';

interface DeckEditorProps {
  document: DeckDocument | null;
  /**
   * 悬停预览主题：只改渲染用 CSS 变量，不 setContent、不改文档数据。
   * 为 null / undefined 时使用 document.attrs.theme.clrScheme。
   */
  previewClrScheme?: DeckTheme | null;
  /**
   * 悬停预览字号 / 颜色：只改 CSS 覆盖，不 setContent、不改 marks。
   */
  previewTextStyle?: TextStyleOverride | null;
}

function computeDeckSize(document: DeckDocument): { width: number; height: number } {
  const width = Math.max(...document.content.map((n) => n.attrs.left + n.attrs.width), 400);
  const height = Math.max(...document.content.map((n) => n.attrs.top + n.attrs.height), 300);
  return { width, height };
}

export function DeckEditor({
  document,
  previewClrScheme = null,
  previewTextStyle = null,
}: DeckEditorProps) {
  const deckSize = useMemo(() => (document ? computeDeckSize(document) : null), [document]);
  const tiptapContent = useMemo(() => (document ? toTiptapDoc(document) : null), [document]);

  const editor = useEditor({
    extensions: deckExtensions,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed || !tiptapContent) {
      return;
    }
    editor.commands.setContent(tiptapContent, { emitUpdate: false });
  }, [editor, tiptapContent]);

  if (!document || !deckSize) {
    return <div className={styles.empty}>转换后将在此用 TipTap 渲染 deck JSON</div>;
  }

  const previewStyle: CSSProperties = {
    width: deckSize.width,
    height: deckSize.height,
  };
  if (previewTextStyle?.fontSize) {
    (previewStyle as Record<string, string>)['--deck-preview-font-size'] =
      previewTextStyle.fontSize;
  }
  if (previewTextStyle?.color) {
    (previewStyle as Record<string, string>)['--deck-preview-text-color'] = toThemeCssValue(
      previewTextStyle.color,
    );
  }

  return (
    <DeckPreviewClrSchemeContext.Provider value={previewClrScheme}>
      <div
        className={styles.deckEditor}
        data-preview-font-size={previewTextStyle?.fontSize ? '' : undefined}
        data-preview-text-color={previewTextStyle?.color ? '' : undefined}
        style={previewStyle}
      >
        <EditorContent editor={editor} />
      </div>
    </DeckPreviewClrSchemeContext.Provider>
  );
}

export { computeDeckSize };
