export {
  convertInfographicFromSyntax,
  convertInfographicToDeck,
} from './convert-infographic-to-deck.js';
export type {
  ConvertInfographicFromSyntaxInput,
  ConvertInfographicInput,
  ConvertInfographicResult,
} from './convert-infographic-to-deck.js';

export {
  convertSvgToDeck,
  extractSvgFromHtml,
  svgElementToCommands,
  extractTextBlocks,
  extractTextDeckNodes,
} from './converter/index.js';
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
} from './types/deck.js';

export {
  GALLERY_TEMPLATE_COUNT,
  getCategoryId,
  getCategoryLabel,
  getGalleryCategories,
  getGalleryTemplateUrl,
} from './gallery/categories.js';
export type { GalleryCategory } from './gallery/categories.js';
export type { Data, ItemDatum } from '@antv/infographic';
export { extractSyntaxFromGalleryHtml, fetchGallerySyntax } from './gallery/fetch-gallery-syntax.js';
export { renderAndConvertFromSyntax } from './gallery/pipeline.js';
export type { PipelineResult } from './gallery/pipeline.js';
export { renderGallerySvgFromSyntax, renderInfographicSvg } from './gallery/render-gallery-svg.js';
