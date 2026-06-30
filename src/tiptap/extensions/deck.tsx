import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

function computeDeckBounds(node: NodeViewProps['node']): { width: number; height: number } {
  let width = 400;
  let height = 300;
  node.forEach((child) => {
    if (child.type.name === 'deckNode') {
      width = Math.max(width, (child.attrs.left as number) + (child.attrs.width as number));
      height = Math.max(height, (child.attrs.top as number) + (child.attrs.height as number));
    }
  });
  return { width, height };
}

function DeckNodeView({ node }: NodeViewProps) {
  const { width, height } = computeDeckBounds(node);

  return (
    <NodeViewWrapper
      as="div"
      data-deck=""
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        border: '1px dashed #d9d9d9',
        background: '#fafafa',
        boxSizing: 'border-box',
      }}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export const Deck = Node.create({
  name: 'deck',
  group: 'block',
  content: 'deckNode+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-deck]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-deck': '' }), 0];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(DeckNodeView);
  },
});
