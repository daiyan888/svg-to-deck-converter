import { parseSyntax } from '@antv/infographic';
import { convertSvgToDeck } from '../converter/svg-to-deck.js';
import { renderInfographicSvg } from './render-gallery-svg.js';
function formatSyntaxErrors(errors) {
    return errors
        .map((error) => `第 ${error.line} 行 · ${error.path}: ${error.message}`)
        .join('\n');
}
export async function renderAndConvertFromSyntax(syntax, options = {}) {
    const trimmed = syntax.trim();
    if (!trimmed) {
        throw new Error('Syntax 不能为空');
    }
    const parsed = parseSyntax(trimmed);
    if (parsed.errors.length > 0) {
        throw new Error(`Syntax 解析失败:\n${formatSyntaxErrors(parsed.errors)}`);
    }
    const svg = await renderInfographicSvg(trimmed);
    const result = convertSvgToDeck(svg, options);
    return {
        svg,
        result,
        warnings: parsed.warnings,
    };
}
