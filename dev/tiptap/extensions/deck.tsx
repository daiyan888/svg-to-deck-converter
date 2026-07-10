import { Node, mergeAttributes, type NodeViewRenderer } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { createContext, useContext } from 'react';
import {
  DEFAULT_DECK_THEME_CONFIG,
  buildClrSchemeCssVars,
  type DeckTheme,
  type DeckThemeConfig,
} from 'svg-to-deck-converter';

/** 悬停预览主题；不改 TipTap 文档 attrs，只影响渲染用的 CSS 变量 */
export const DeckPreviewClrSchemeContext = createContext<DeckTheme | null>(null);

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
  const theme = (node.attrs.theme as DeckThemeConfig | null) ?? DEFAULT_DECK_THEME_CONFIG;
  const previewClrScheme = useContext(DeckPreviewClrSchemeContext);
  const clrScheme = previewClrScheme ?? theme.clrScheme;
  const cssVars = buildClrSchemeCssVars(clrScheme);

  return (
    <NodeViewWrapper
      as="div"
      data-deck=""
      data-theme-name={clrScheme.name}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        border: '1px dashed #d9d9d9',
        background: '#fafafa',
        boxSizing: 'border-box',
        ...cssVars,
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

  addAttributes() {
    return {
      theme: {
        default: DEFAULT_DECK_THEME_CONFIG,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-theme');
          if (!raw) {
            return DEFAULT_DECK_THEME_CONFIG;
          }
          try {
            return JSON.parse(raw) as DeckThemeConfig;
          } catch {
            return DEFAULT_DECK_THEME_CONFIG;
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.theme) {
            return {};
          }
          return { 'data-theme': JSON.stringify(attributes.theme) };
        },
      },
    };
  },

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
