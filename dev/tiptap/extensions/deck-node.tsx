import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

function DeckNodeNodeView({ node }: NodeViewProps) {
  const { width, height, top, left, wrap } = node.attrs as {
    width: number;
    height: number;
    top: number;
    left: number;
    wrap?: boolean;
  };

  return (
    <NodeViewWrapper
      as="div"
      data-deck-node=""
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        width,
        height,
        top,
        left,
        whiteSpace: wrap === false ? 'nowrap' : undefined,
      }}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export const DeckNode = Node.create({
  name: 'deckNode',
  group: 'block',
  content: '(svg|multiBlockContainer)',
  defining: true,

  addAttributes() {
    return {
      width: { default: 0 },
      height: { default: 0 },
      top: { default: 0 },
      left: { default: 0 },
      wrap: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-deck-node]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { width, height, top, left, wrap } = node.attrs;
    const wrapStyle = wrap === false ? 'white-space:nowrap;' : '';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-deck-node': '',
        style: `position:absolute;box-sizing:border-box;width:${width}px;height:${height}px;top:${top}px;left:${left}px;${wrapStyle}`,
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(DeckNodeNodeView);
  },
});
