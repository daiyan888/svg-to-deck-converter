export { convertSvgToDeck, extractSvgFromHtml } from './svg-to-deck.js';
export { svgElementToCommands } from './svg-to-commands.js';
export { extractTextBlocks, extractTextDeckNodes } from './text-extractor.js';
export {
  applyDeckOffsets,
  applySvgPixelSize,
  computeMeetLayout,
  finalizeSizedConvertResult,
  resolveTargetSize,
  scaleConvertResult,
  scaleDeckDocument,
} from './scale-deck.js';
export type { TargetSize } from './scale-deck.js';
export type {
  CommandsItem,
  ConvertOptions,
  ConvertResult,
  DeckDocument,
  DeckDocumentAttrs,
  DeckNode,
  DeckNodeChild,
  DeckTheme,
  DeckThemeConfig,
  MultiBlockContainerNode,
  ParagraphNode,
  SvgNode,
  TextNode,
  TextGradientColorMark,
  TextMark,
  TextStyleMark,
  ThemeColorSlot,
} from '../types/deck.js';
export {
  DEFAULT_TEXT_STYLE_LINE_HEIGHT,
  LINE_HEIGHT_RENDER_FACTOR,
  DEFAULT_TEXT_STYLE_TEXT_ALIGN,
  DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN,
  DEFAULT_MULTI_BLOCK_CONTAINER_PADDING,
} from '../types/deck.js';
export type { TextAlign, VerticalAlign } from '../types/deck.js';
