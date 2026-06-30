import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

function MultiBlockContainNodeView() {
  return (
    <NodeViewWrapper
      as="div"
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        whiteSpace: 'pre-wrap',
        pointerEvents: 'none',
      }}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export const MultiBlockContain = Node.create({
  name: 'multiBlockContain',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-multi-block-contain]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-multi-block-contain': '',
        style: 'white-space:pre-wrap;',
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(MultiBlockContainNodeView);
  },
});
