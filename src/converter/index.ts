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
