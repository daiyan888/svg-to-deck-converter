import type { ConvertOptions, ConvertResult } from '../types/deck.js';
/**
 * 将 SVG 字符串转换为 TipTap deck 文档 JSON
 * 每个 deckNode 只有一个子节点，多个元素拆成多个 deckNode，由 left/top 相对 deck 定位
 */
export declare function convertSvgToDeck(svgString: string, options?: ConvertOptions): ConvertResult;
/**
 * 从页面中提取 SVG 字符串（用于从 AntV Gallery 等页面复制）
 */
export declare function extractSvgFromHtml(html: string): string | null;
//# sourceMappingURL=svg-to-deck.d.ts.map