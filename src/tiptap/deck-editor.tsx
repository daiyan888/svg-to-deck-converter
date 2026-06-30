import { EditorContent, useEditor } from '@tiptap/react';
import { useEffect, useMemo } from 'react';
import type { DeckDocument } from '../types/deck';
import { deckExtensions } from './extensions';
import { toTiptapDoc } from './to-tiptap-doc';
import styles from './deck-editor.module.css';

interface DeckEditorProps {
  document: DeckDocument | null;
}

function computeDeckSize(document: DeckDocument): { width: number; height: number } {
  const width = Math.max(...document.content.map((n) => n.attrs.left + n.attrs.width), 400);
  const height = Math.max(...document.content.map((n) => n.attrs.top + n.attrs.height), 300);
  return { width, height };
}

export function DeckEditor({ document }: DeckEditorProps) {
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

  return (
    <div className={styles.deckEditor} style={{ width: deckSize.width, height: deckSize.height }}>
      <EditorContent editor={editor} />
    </div>
  );
}

export { computeDeckSize };
