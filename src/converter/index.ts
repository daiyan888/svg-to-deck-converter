export { convertSvgToDeck, extractSvgFromHtml } from './svg-to-deck';
export { svgElementToCommands } from './svg-to-commands';
export { extractTextBlocks, extractTextDeckNodes } from './text-extractor';
export type {
  CommandsItem,
  ConvertOptions,
  ConvertResult,
  DeckDocument,
  DeckNode,
  DeckNodeChild,
  MultiBlockContainNode,
  ParagraphNode,
  SvgNode,
  TextNode,
  TextGradientColorMark,
  TextMark,
  TextStyleMark,
} from '../types/deck';
