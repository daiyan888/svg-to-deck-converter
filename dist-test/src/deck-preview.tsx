import { useMemo, type CSSProperties } from 'react';
import {
  buildClrSchemeCssVars,
  toThemeCssValue,
  type CommandsItem,
  type DeckDocument,
  type DeckNode,
  type DeckNodeChild,
  type MultiBlockContainerNode,
  type ParagraphNode,
  type TextNode,
} from '../../dist/index.js';

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

const ATTR_KEBAB_MAP: Record<string, string> = {
  className: 'class',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  strokeOpacity: 'stroke-opacity',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  clipPath: 'clip-path',
  clipRule: 'clip-rule',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  textAnchor: 'text-anchor',
  dominantBaseline: 'dominant-baseline',
  xlinkHref: 'xlink:href',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function toKebabCase(name: string): string {
  if (ATTR_KEBAB_MAP[name]) {
    return ATTR_KEBAB_MAP[name];
  }
  if (!name.includes('-') && /[A-Z]/.test(name)) {
    return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  }
  return name;
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
      attrs.push(`${toKebabCase(key)}="${escapeAttr(String(resolveColorAttr(key, value)))}"`);
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

function textStyle(node: TextNode): CSSProperties | undefined {
  const textStyleMark = node.marks?.find((m) => m.type === 'textStyle');
  const colorMark = node.marks?.find((m) => m.type === 'textGradientColor');
  const style: CSSProperties = {};

  if (textStyleMark) {
    style.fontFamily = textStyleMark.attrs.fontFamily;
    style.fontSize = textStyleMark.attrs.fontSize;
  }
  if (colorMark?.attrs.textGradientColor) {
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

function renderText(node: TextNode, key: number) {
  return (
    <span key={key} style={textStyle(node)}>
      {node.text}
    </span>
  );
}

function renderParagraph(p: ParagraphNode, key: number) {
  return (
    <p key={key} style={{ margin: 0, lineHeight: 1.2, textAlign: p.attrs?.textAlign }}>
      {p.content.map((t, i) => renderText(t, i))}
    </p>
  );
}

function renderMultiBlock(node: MultiBlockContainerNode) {
  return (
    <div style={{ padding: node.attrs.padding, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      {node.content.map((p, i) => renderParagraph(p, i))}
    </div>
  );
}

function renderChild(child: DeckNodeChild) {
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
  return renderMultiBlock(child);
}

function renderDeckNode(node: DeckNode, key: number) {
  const { width, height, top, left, wrap } = node.attrs;
  return (
    <div
      key={key}
      style={{
        position: 'absolute',
        width,
        height,
        top,
        left,
        whiteSpace: wrap === false ? 'nowrap' : undefined,
        overflow: 'hidden',
      }}
    >
      {node.content[0] ? renderChild(node.content[0]) : null}
    </div>
  );
}

interface DeckPreviewProps {
  document: DeckDocument;
}

export function DeckPreview({ document }: DeckPreviewProps) {
  const theme = document.attrs.theme;
  const cssVars = useMemo(
    () => buildClrSchemeCssVars(theme.clrScheme),
    [theme.clrScheme],
  );
  const width = Math.max(...document.content.map((n) => n.attrs.left + n.attrs.width), 400);
  const height = Math.max(...document.content.map((n) => n.attrs.top + n.attrs.height), 300);

  return (
    <div
      className="deckPreview"
      data-theme-name={theme.clrScheme.name}
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
      {document.content.map((node, i) => renderDeckNode(node, i))}
    </div>
  );
}
