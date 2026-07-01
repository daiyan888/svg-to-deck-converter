import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';

const DEFAULT_PADDING = '0px 0px 0px 0px';

function MultiBlockContainerNodeView({ node }: NodeViewProps) {
  const { padding } = node.attrs as { padding: string };

  return (
    <NodeViewWrapper
      as="div"
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding,
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

  addAttributes() {
    return {
      padding: { default: DEFAULT_PADDING },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-multi-block-container]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { padding } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-multi-block-container': '',
        style: `white-space:pre-wrap;padding:${padding};`,
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(MultiBlockContainerNodeView);
  },
});
