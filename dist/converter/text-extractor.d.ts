import { type ViewBoxInfo } from './transform-utils.js';
import type { MultiBlockContainerNode } from '../types/deck.js';
export interface TextExtractContext {
    textNodeCount: number;
}
export interface TextDeckNodeCandidate {
    left: number;
    top: number;
    width: number;
    height: number;
    multiBlockContainer: MultiBlockContainerNode;
}
export declare function extractTextDeckNodes(svgRoot: SVGSVGElement, viewBox: ViewBoxInfo, defaultFontFamily: string, defaultFontSize: number, ctx: TextExtractContext): TextDeckNodeCandidate[];
/** @deprecated 使用 extractTextDeckNodes */
export declare function extractTextBlocks(svgRoot: SVGSVGElement, defaultFontFamily: string, defaultFontSize: number, ctx: TextExtractContext): MultiBlockContainerNode[];
//# sourceMappingURL=text-extractor.d.ts.map