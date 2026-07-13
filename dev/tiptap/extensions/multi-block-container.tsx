import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  DEFAULT_MULTI_BLOCK_CONTAINER_PADDING,
  DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
  type VerticalAlign,
} from 'svg-to-deck-converter';

function MultiBlockContainerNodeView({ node }: NodeViewProps) {
  const { padding, verticalAlign } = node.attrs as {
    padding: string;
    verticalAlign: VerticalAlign;
  };

  return (
    <NodeViewWrapper
      as="div"
      data-multi-block-container=""
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        margin: 0,
        padding,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: verticalAlign ?? DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
        alignContent: verticalAlign ?? DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
        whiteSpace: 'pre-wrap',
        pointerEvents: 'none',
      }}
    >
      <NodeViewContent style={{ width: '100%', height: 'auto' }} />
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
      padding: { default: DEFAULT_MULTI_BLOCK_CONTAINER_PADDING },
      verticalAlign: { default: DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-multi-block-container]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { padding, verticalAlign } = node.attrs as {
      padding: string;
      verticalAlign: VerticalAlign;
    };
    const align = verticalAlign ?? DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-multi-block-container': '',
        style: `width:100%;height:100%;box-sizing:border-box;margin:0;display:flex;flex-wrap:wrap;align-items:${align};align-content:${align};white-space:pre-wrap;padding:${padding};`,
      }),
      0,
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(MultiBlockContainerNodeView);
  },
});
