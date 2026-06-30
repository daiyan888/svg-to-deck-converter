import Document from '@tiptap/extension-document';

/** 根文档只允许包含 deck 节点 */
export const DeckDocument = Document.extend({
  content: 'deck',
});
