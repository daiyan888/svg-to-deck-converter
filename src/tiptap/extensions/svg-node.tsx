import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { SvgFromCommands } from '../../renderer/svg-from-commands';
import type { CommandsItem } from '../../types/deck';

function SvgNodeView({ node }: NodeViewProps) {
  const { width, height, viewBox, commands } = node.attrs as {
    width: number;
    height: number;
    viewBox?: string;
    commands: CommandsItem[];
  };

  return (
    <NodeViewWrapper
      as="div"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
      }}
    >
      <SvgFromCommands width={width} height={height} viewBox={viewBox} commands={commands} />
    </NodeViewWrapper>
  );
}

export const SvgNode = Node.create({
  name: 'svg',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      width: { default: 0 },
      height: { default: 0 },
      viewBox: { default: null },
      commands: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute('data-commands');
          if (!raw) {
            return [];
          }
          try {
            return JSON.parse(raw) as CommandsItem[];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => {
          const commands = attributes.commands as CommandsItem[];
          if (!commands?.length) {
            return {};
          }
          return { 'data-commands': JSON.stringify(commands) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-svg-node]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { width, height } = node.attrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-svg-node': '',
        style: `position:absolute;top:0;left:0;width:${width}px;height:${height}px;`,
      }),
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ReactNodeViewRenderer(SvgNodeView);
  },
});
