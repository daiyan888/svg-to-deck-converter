import {
  DEFAULT_DECK_THEME_CONFIG,
  buildClrSchemeCssVars,
  type DeckDocument,
  type DeckNode,
  type DeckNodeChild,
} from 'svg-to-deck-converter';
import { MultiBlockContainerRenderer } from './multi-block-container-renderer';
import { SvgFromCommands } from './svg-from-commands';
import styles from './deck-renderer.module.css';

function renderDeckNodeChild(child: DeckNodeChild) {
  if (child.type === 'svg') {
    return (
      <SvgFromCommands
        width={child.attrs.width}
        height={child.attrs.height}
        viewBox={child.attrs.viewBox}
        commands={child.attrs.commands}
        className={styles.svgLayer}
      />
    );
  }
  return <MultiBlockContainerRenderer node={child} />;
}

function renderDeckNode(node: DeckNode, key: number) {
  const { width, height, top, left } = node.attrs;
  const child = node.content[0];
  return (
    <div
      key={key}
      className={styles.deckNode}
      style={{ width, height, top, left }}
    >
      {child ? renderDeckNodeChild(child) : null}
    </div>
  );
}

interface DeckRendererProps {
  document: DeckDocument;
  className?: string;
}

export function DeckRenderer({ document, className }: DeckRendererProps) {
  const contentWidth = Math.max(...document.content.map((n) => n.attrs.left + n.attrs.width), 400);
  const contentHeight = Math.max(...document.content.map((n) => n.attrs.top + n.attrs.height), 300);
  const maxWidth =
    typeof document.attrs?.width === 'number' && document.attrs.width > 0
      ? document.attrs.width
      : contentWidth;
  const maxHeight =
    typeof document.attrs?.height === 'number' && document.attrs.height > 0
      ? document.attrs.height
      : contentHeight;
  const theme = document.attrs?.theme ?? DEFAULT_DECK_THEME_CONFIG;
  const cssVars = buildClrSchemeCssVars(theme.clrScheme);

  return (
    <div
      className={`${styles.deck} ${className ?? ''}`}
      data-theme-name={theme.clrScheme.name}
      style={{ width: maxWidth, height: maxHeight, ...cssVars }}
    >
      {document.content.map((node, i) => renderDeckNode(node, i))}
    </div>
  );
}
