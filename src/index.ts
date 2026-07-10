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
  applyDeckOffsets,
  applySvgPixelSize,
  computeMeetLayout,
  finalizeSizedConvertResult,
  resolveTargetSize,
  scaleConvertResult,
  scaleDeckDocument,
} from './converter/index.js';
export type { TargetSize } from './converter/index.js';
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
} from './types/deck.js';

export {
  DEFAULT_DECK_THEME,
  DEFAULT_DECK_THEME_CONFIG,
  THEME_COLOR_SLOTS,
  buildClrSchemeCssVars,
  isThemeColorSlot,
  resolveThemeColor,
  toThemeCssValue,
} from './theme/deck-theme.js';
export {
  buildColorSlotLookup,
  buildDeckThemeFromInfographic,
  resolvePaletteColors,
} from './theme/build-theme-from-infographic.js';
export {
  mapColorToSlot,
  mapColorsInCssValue,
  tokenizeDeckDocumentColors,
} from './theme/tokenize-colors.js';
export { normalizeColor, normalizeColorHex } from './theme/color-normalize.js';

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
