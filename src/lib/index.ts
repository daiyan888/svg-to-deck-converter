export {
  convertSvgToDeck,
  extractSvgFromHtml,
  svgElementToCommands,
  extractTextBlocks,
  extractTextDeckNodes,
} from '../converter';
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
export { deckExtensions } from '../tiptap/extensions';
