import type { Data, InfographicOptions, SyntaxError, ThemeConfig } from '@antv/infographic';
import { getTemplates, parseSyntax } from '@antv/infographic';
import { convertSvgToDeck } from './converter/svg-to-deck.js';
import { finalizeSizedConvertResult } from './converter/scale-deck.js';
import { getCategoryId } from './gallery/categories.js';
import { fetchGallerySyntax } from './gallery/fetch-gallery-syntax.js';
import { renderInfographicSvg } from './gallery/render-gallery-svg.js';
import { renderAndConvertFromSyntax } from './gallery/pipeline.js';
import { buildDeckThemeFromInfographic } from './theme/build-theme-from-infographic.js';
import type { ConvertOptions, ConvertResult, DeckDocument, DeckThemeConfig } from './types/deck.js';

export interface ConvertInfographicInput {
  /** Gallery 类型 ID，如 chart-bar */
  category: string;
  /** 模板示例名（slug），如 chart-bar-plain-text */
  template: string;
  /** 图表数据 */
  data: Data;
  /** 主题名称，默认从 Gallery 示例继承，否则为 light */
  theme?: string;
  /** 额外主题配置 */
  themeConfig?: ThemeConfig;
  /**
   * 写入 deck.attrs.theme；不传则根据 AntV theme / themeConfig 自动构建 clrScheme。
   */
  deckTheme?: DeckThemeConfig;
  /**
   * 是否将渲染色映射为主题色槽，默认 true。
   * 设为 false 时保留 SVG 原始 hex，仅写入 theme 表。
   */
  mapColorsToThemeSlots?: boolean;
  /** 是否从 Gallery 拉取示例默认 theme / design，默认 true */
  useGalleryDefaults?: boolean;
  /** SVG → deck 转换选项 */
  convertOptions?: ConvertOptions;
  /** 所有 deckNode 的 top 统一偏移（优先级高于 convertOptions.offsetTop） */
  offsetTop?: number;
  /** 所有 deckNode 的 left 统一偏移（优先级高于 convertOptions.offsetLeft） */
  offsetLeft?: number;
  /** 渲染宽度 */
  width?: number;
  /** 渲染高度 */
  height?: number;
}

export interface ConvertInfographicResult {
  svg: string;
  document: DeckDocument;
  stats: ConvertResult['stats'];
  warnings: SyntaxError[];
}

export interface ConvertInfographicFromSyntaxInput {
  syntax: string;
  convertOptions?: ConvertOptions;
  /** 写入 deck.attrs.theme；不传则根据 Syntax 中的 theme 自动构建 */
  deckTheme?: DeckThemeConfig;
  /** 是否将渲染色映射为主题色槽，默认 true */
  mapColorsToThemeSlots?: boolean;
  /** 所有 deckNode 的 top 统一偏移（优先级高于 convertOptions.offsetTop） */
  offsetTop?: number;
  /** 所有 deckNode 的 left 统一偏移（优先级高于 convertOptions.offsetLeft） */
  offsetLeft?: number;
  /** 渲染宽度，默认 960 */
  width?: number;
  /** 渲染高度，默认 640 */
  height?: number;
}

function resolveThemeConvertOptions(
  convertOptions: ConvertOptions | undefined,
  renderTheme: string | undefined,
  renderThemeConfig: ThemeConfig | undefined,
  deckTheme: DeckThemeConfig | undefined,
  mapColorsToThemeSlots: boolean | undefined,
): ConvertOptions {
  const theme =
    deckTheme ??
    buildDeckThemeFromInfographic({
      theme: typeof renderTheme === 'string' ? renderTheme : undefined,
      themeConfig: renderThemeConfig,
    });

  return {
    ...convertOptions,
    theme,
    mapColorsToThemeSlots: mapColorsToThemeSlots ?? true,
  };
}

function resolveConvertOptions(
  convertOptions?: ConvertOptions,
  offsetTop?: number,
  offsetLeft?: number,
): ConvertOptions {
  return {
    ...convertOptions,
    ...(offsetTop !== undefined ? { offsetTop } : {}),
    ...(offsetLeft !== undefined ? { offsetLeft } : {}),
  };
}

function assertTemplateInCategory(category: string, template: string): void {
  if (!getTemplates().includes(template)) {
    throw new Error(`未知模板: ${template}`);
  }

  const actualCategory = getCategoryId(template);
  if (actualCategory !== category) {
    throw new Error(
      `模板 "${template}" 不属于类型 "${category}"，实际类型为 "${actualCategory}"`,
    );
  }
}

async function resolveRenderOptions(
  input: ConvertInfographicInput,
): Promise<Partial<InfographicOptions>> {
  const base: Partial<InfographicOptions> = {
    template: input.template,
    data: input.data,
    theme: input.theme ?? 'light',
    themeConfig: input.themeConfig,
  };

  if (input.useGalleryDefaults === false) {
    return base;
  }

  try {
    const syntax = await fetchGallerySyntax(input.template);
    const parsed = parseSyntax(syntax);
    return {
      ...parsed.options,
      ...base,
      template: input.template,
      data: input.data,
      theme: input.theme ?? parsed.options.theme ?? base.theme,
      themeConfig: input.themeConfig ?? parsed.options.themeConfig,
    };
  } catch {
    return base;
  }
}

/**
 * 根据 Gallery 类型、模板示例名与数据，渲染 SVG 并转换为 TipTap deck JSON。
 */
export async function convertInfographicToDeck(
  input: ConvertInfographicInput,
): Promise<ConvertInfographicResult> {
  assertTemplateInCategory(input.category, input.template);

  const renderOptions = await resolveRenderOptions(input);
  const size = {
    width: input.width ?? 960,
    height: input.height ?? 640,
  };
  const svg = await renderInfographicSvg(
    renderOptions as Parameters<typeof renderInfographicSvg>[0],
    size,
  );

  const themeOptions = resolveThemeConvertOptions(
    input.convertOptions,
    typeof renderOptions.theme === 'string' ? renderOptions.theme : undefined,
    renderOptions.themeConfig,
    input.deckTheme,
    input.mapColorsToThemeSlots,
  );
  const convertOptions = resolveConvertOptions(
    themeOptions,
    input.offsetTop,
    input.offsetLeft,
  );
  const converted = convertSvgToDeck(svg, {
    ...convertOptions,
    offsetTop: 0,
    offsetLeft: 0,
  });
  const finalized = finalizeSizedConvertResult(svg, converted, size, convertOptions);

  return {
    svg: finalized.svg,
    document: finalized.result.document,
    stats: finalized.result.stats,
    warnings: [],
  };
}

/**
 * 根据完整 Infographic Syntax 字符串渲染 SVG 并转换为 TipTap deck JSON。
 */
export async function convertInfographicFromSyntax(
  input: ConvertInfographicFromSyntaxInput | string,
  convertOptions?: ConvertOptions,
): Promise<ConvertInfographicResult> {
  const syntax = typeof input === 'string' ? input : input.syntax;
  const size =
    typeof input === 'string'
      ? {}
      : { width: input.width, height: input.height };

  const parsed = parseSyntax(syntax.trim());
  const themeOptions =
    typeof input === 'string'
      ? resolveThemeConvertOptions(
          convertOptions,
          typeof parsed.options.theme === 'string' ? parsed.options.theme : undefined,
          parsed.options.themeConfig,
          undefined,
          undefined,
        )
      : resolveThemeConvertOptions(
          input.convertOptions,
          typeof parsed.options.theme === 'string' ? parsed.options.theme : undefined,
          parsed.options.themeConfig,
          input.deckTheme,
          input.mapColorsToThemeSlots,
        );

  const options =
    typeof input === 'string'
      ? themeOptions
      : resolveConvertOptions(themeOptions, input.offsetTop, input.offsetLeft);

  const pipeline = await renderAndConvertFromSyntax(syntax, options, size);

  return {
    svg: pipeline.svg,
    document: pipeline.result.document,
    stats: pipeline.result.stats,
    warnings: pipeline.warnings,
  };
}
