import { type SyntaxError } from '@antv/infographic';
import type { ConvertOptions, ConvertResult } from '../types/deck.js';
export interface PipelineResult {
    svg: string;
    result: ConvertResult;
    warnings: SyntaxError[];
}
export declare function renderAndConvertFromSyntax(syntax: string, options?: ConvertOptions): Promise<PipelineResult>;
//# sourceMappingURL=pipeline.d.ts.map