import type { Data, SyntaxError, ThemeConfig } from '@antv/infographic';
import type { ConvertOptions, ConvertResult, DeckDocument } from './types/deck.js';
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
    /** 是否从 Gallery 拉取示例默认 theme / design，默认 true */
    useGalleryDefaults?: boolean;
    /** SVG → deck 转换选项 */
    convertOptions?: ConvertOptions;
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
}
/**
 * 根据 Gallery 类型、模板示例名与数据，渲染 SVG 并转换为 TipTap deck JSON。
 */
export declare function convertInfographicToDeck(input: ConvertInfographicInput): Promise<ConvertInfographicResult>;
/**
 * 根据完整 Infographic Syntax 字符串渲染 SVG 并转换为 TipTap deck JSON。
 */
export declare function convertInfographicFromSyntax(input: ConvertInfographicFromSyntaxInput | string, convertOptions?: ConvertOptions): Promise<ConvertInfographicResult>;
//# sourceMappingURL=convert-infographic-to-deck.d.ts.map