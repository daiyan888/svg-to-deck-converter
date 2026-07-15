import { useMemo, type CSSProperties } from 'react';
import {
  buildClrSchemeCssVars,
  DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
  DEFAULT_PARAGRAPH_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_TEXT_ALIGN,
  LINE_HEIGHT_RENDER_FACTOR,
  svgAttrNameFromCamel,
  toThemeCssValue,
  type CommandsItem,
  type DeckDocument,
  type DeckNode,
  type DeckNodeChild,
  type DeckTheme,
  type MultiBlockContainerNode,
  type ParagraphNode,
  type TextNode,
} from '../../dist/browser/index.js';
import type { TextStyleOverride } from './apply-text-style';

const COLOR_ATTRS = new Set([
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'color',
]);

const VOID_ELEMENTS = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'stop',
  'use',
  'image',
]);

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function resolveColorAttr(key: string, value: string | number | boolean): string | number | boolean {
  if (typeof value !== 'string' || !COLOR_ATTRS.has(key)) {
    return value;
  }
  return toThemeCssValue(value);
}

function commandToMarkup(item: CommandsItem): string {
  const { comp, children, innerHTML } = item;
  const attrs: string[] = [];
  for (const [key, value] of Object.entries(item)) {
    if (key === 'comp' || key === 'children' || key === 'innerHTML' || key === 'key') {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attrs.push(
        `${svgAttrNameFromCamel(key)}="${escapeAttr(String(resolveColorAttr(key, value)))}"`,
      );
    }
  }
  const open = attrs.length ? `<${comp} ${attrs.join(' ')}` : `<${comp}`;

  if (typeof innerHTML === 'string') {
    return `${open}>${innerHTML}</${comp}>`;
  }
  if (!children?.length) {
    return VOID_ELEMENTS.has(comp) ? `${open} />` : `${open}></${comp}>`;
  }
  return `${open}>${children.map(commandToMarkup).join('')}</${comp}>`;
}

function resolveGradientSlots(gradient: string): string {
  return gradient.replace(
    /\b(dk[12]|lt[12]|accent[1-6]|hlink|folHlink)\b/g,
    (slot) => toThemeCssValue(slot),
  );
}

function textStyle(
  node: TextNode,
  previewTextStyle?: TextStyleOverride | null,
): CSSProperties | undefined {
  const textStyleMark = node.marks?.find((m) => m.type === 'textStyle');
  const colorMark = node.marks?.find((m) => m.type === 'textGradientColor');
  const style: CSSProperties = {};

  if (textStyleMark) {
    style.fontFamily = textStyleMark.attrs.fontFamily;
    style.fontSize = previewTextStyle?.fontSize ?? textStyleMark.attrs.fontSize;
    style.lineHeight = 'var(--data-line-height)';
  } else if (previewTextStyle?.fontSize) {
    style.fontSize = previewTextStyle.fontSize;
  }

  if (previewTextStyle?.color) {
    style.color = toThemeCssValue(previewTextStyle.color);
    style.WebkitTextFillColor = toThemeCssValue(previewTextStyle.color);
    style.background = 'none';
    style.WebkitBackgroundClip = 'border-box';
    style.backgroundClip = 'border-box';
  } else if (colorMark?.attrs.textGradientColor) {
    style.background = resolveGradientSlots(colorMark.attrs.textGradientColor);
    style.WebkitBackgroundClip = 'text';
    style.backgroundClip = 'text';
    style.WebkitTextFillColor = 'transparent';
    style.color = 'transparent';
  } else if (colorMark?.attrs.color) {
    style.color = toThemeCssValue(colorMark.attrs.color);
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function renderText(
  node: TextNode,
  key: number,
  previewTextStyle?: TextStyleOverride | null,
) {
  return (
    <span key={key} style={textStyle(node, previewTextStyle)}>
      {node.text}
    </span>
  );
}

function renderParagraph(
  p: ParagraphNode,
  key: number,
  previewTextStyle?: TextStyleOverride | null,
) {
  const lineHeight = p.attrs?.lineHeight ?? DEFAULT_PARAGRAPH_LINE_HEIGHT;
  return (
    <p
      key={key}
      style={{
        margin: 0,
        width: '100%',
        lineHeight: 0,
        ['--data-line-height' as string]: lineHeight * LINE_HEIGHT_RENDER_FACTOR,
        textAlign: p.attrs?.textAlign ?? DEFAULT_PARAGRAPH_TEXT_ALIGN,
      }}
    >
      {p.content.map((t, i) => renderText(t, i, previewTextStyle))}
    </p>
  );
}

function renderMultiBlock(
  node: MultiBlockContainerNode,
  previewTextStyle?: TextStyleOverride | null,
) {
  const verticalAlign = node.attrs.verticalAlign ?? DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: verticalAlign,
        alignContent: verticalAlign,
        padding: node.attrs.padding,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        margin: 0,
        whiteSpace: 'pre-wrap',
      }}
    >
      {node.content.map((p, i) => renderParagraph(p, i, previewTextStyle))}
    </div>
  );
}

function renderChild(child: DeckNodeChild, previewTextStyle?: TextStyleOverride | null) {
  if (child.type === 'svg') {
    const markup = child.attrs.commands.map(commandToMarkup).join('');
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={child.attrs.width}
        height={child.attrs.height}
        viewBox={child.attrs.viewBox ?? `0 0 ${child.attrs.width} ${child.attrs.height}`}
        style={{ display: 'block', width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }
  return renderMultiBlock(child, previewTextStyle);
}

function renderDeckNode(
  node: DeckNode,
  key: number,
  previewTextStyle?: TextStyleOverride | null,
) {
  const { width, height, top, left } = node.attrs;
  return (
    <div
      key={key}
      style={{
        position: 'absolute',
        width,
        height,
        top,
        left,
        overflow: 'visible',
      }}
    >
      {node.content[0] ? renderChild(node.content[0], previewTextStyle) : null}
    </div>
  );
}

interface DeckPreviewProps {
  document: DeckDocument;
  /**
   * 悬停预览主题：只改 CSS 变量，不改 document 结构。
   * 为 null / undefined 时使用 document.attrs.theme.clrScheme。
   */
  previewClrScheme?: DeckTheme | null;
  /** 悬停预览字号 / 颜色：只改渲染，不改 marks */
  previewTextStyle?: TextStyleOverride | null;
}

export function DeckPreview({
  document,
  previewClrScheme = null,
  previewTextStyle = null,
}: DeckPreviewProps) {
  const clrScheme = previewClrScheme ?? document.attrs.theme.clrScheme;
  const cssVars = useMemo(() => buildClrSchemeCssVars(clrScheme), [clrScheme]);
  const contentWidth = Math.max(...document.content.map((n) => n.attrs.left + n.attrs.width), 400);
  const contentHeight = Math.max(...document.content.map((n) => n.attrs.top + n.attrs.height), 300);
  const width =
    typeof document.attrs.width === 'number' && document.attrs.width > 0
      ? document.attrs.width
      : contentWidth;
  const height =
    typeof document.attrs.height === 'number' && document.attrs.height > 0
      ? document.attrs.height
      : contentHeight;

  return (
    <div
      className="deckPreview"
      data-theme-name={clrScheme.name}
      style={{
        position: 'relative',
        width,
        height,
        maxWidth: '100%',
        overflow: 'hidden',
        background: '#fafafa',
        border: '1px dashed #d9d9d9',
        boxSizing: 'border-box',
        ...cssVars,
      }}
    >
      {document.content.map((node, i) => renderDeckNode(node, i, previewTextStyle))}
    </div>
  );
}
