import { type InfographicOptions } from '@antv/infographic';
export interface RenderInfographicSize {
    width?: number;
    height?: number;
}
/**
 * 在浏览器或 Node 环境中渲染 Infographic，返回 SVG 字符串。
 * 浏览器走 DOM 渲染；Node 走 @antv/infographic/ssr（避免污染 globalThis.window）。
 */
export declare function renderInfographicSvg(options: string | Partial<InfographicOptions>, size?: RenderInfographicSize): Promise<string>;
export declare function renderGallerySvgFromSyntax(syntax: string): Promise<string>;
//# sourceMappingURL=render-gallery-svg.d.ts.map