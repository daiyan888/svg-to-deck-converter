import { getTemplates, parseSyntax } from '@antv/infographic';
import { convertSvgToDeck } from './converter/svg-to-deck.js';
import { getCategoryId } from './gallery/categories.js';
import { fetchGallerySyntax } from './gallery/fetch-gallery-syntax.js';
import { renderInfographicSvg } from './gallery/render-gallery-svg.js';
import { renderAndConvertFromSyntax } from './gallery/pipeline.js';
function assertTemplateInCategory(category, template) {
    if (!getTemplates().includes(template)) {
        throw new Error(`未知模板: ${template}`);
    }
    const actualCategory = getCategoryId(template);
    if (actualCategory !== category) {
        throw new Error(`模板 "${template}" 不属于类型 "${category}"，实际类型为 "${actualCategory}"`);
    }
}
async function resolveRenderOptions(input) {
    const base = {
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
    }
    catch {
        return base;
    }
}
/**
 * 根据 Gallery 类型、模板示例名与数据，渲染 SVG 并转换为 TipTap deck JSON。
 */
export async function convertInfographicToDeck(input) {
    assertTemplateInCategory(input.category, input.template);
    const renderOptions = await resolveRenderOptions(input);
    const svg = await renderInfographicSvg(renderOptions, {
        width: input.width ?? 960,
        height: input.height ?? 640,
    });
    const converted = convertSvgToDeck(svg, input.convertOptions);
    return {
        svg,
        document: converted.document,
        stats: converted.stats,
        warnings: [],
    };
}
/**
 * 根据完整 Infographic Syntax 字符串渲染 SVG 并转换为 TipTap deck JSON。
 */
export async function convertInfographicFromSyntax(input, convertOptions) {
    const syntax = typeof input === 'string' ? input : input.syntax;
    const options = typeof input === 'string' ? convertOptions : input.convertOptions;
    const pipeline = await renderAndConvertFromSyntax(syntax, options);
    return {
        svg: pipeline.svg,
        document: pipeline.result.document,
        stats: pipeline.result.stats,
        warnings: pipeline.warnings,
    };
}
