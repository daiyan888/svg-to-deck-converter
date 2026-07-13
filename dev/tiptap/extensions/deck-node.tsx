import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

function DeckNodeNodeView({ node }: NodeViewProps) {
  const { width, height, top, left } = node.attrs as {
    width: number;
    height: number;
    top: number;
    left: number;
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
        overflow: 'hidden',
      }}
    >
      <NodeViewContent
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
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
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-deck-node]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { width, height, top, left } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-deck-node': '',
        style: `position:absolute;box-sizing:border-box;overflow:hidden;width:${width}px;height:${height}px;top:${top}px;left:${left}px;`,
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(DeckNodeNodeView);
  },
});
