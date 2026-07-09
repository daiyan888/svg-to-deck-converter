export { convertSvgToDeck, extractSvgFromHtml } from './svg-to-deck.js';
export { svgElementToCommands } from './svg-to-commands.js';
export { extractTextBlocks, extractTextDeckNodes } from './text-extractor.js';
export {
  applyDeckOffsets,
  applySvgPixelSize,
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
  DeckNode,
  DeckNodeChild,
  MultiBlockContainerNode,
  ParagraphNode,
  SvgNode,
  TextNode,
  TextGradientColorMark,
  TextMark,
  TextStyleMark,
} from '../types/deck.js';
