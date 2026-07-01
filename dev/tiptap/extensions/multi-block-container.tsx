import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

function MultiBlockContainerNodeView() {
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

export const MultiBlockContainer = Node.create({
  name: 'multiBlockContainer',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-multi-block-container]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-multi-block-container': '',
        style: 'white-space:pre-wrap;',
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(MultiBlockContainerNodeView);
  },
});
