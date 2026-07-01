import type { CommandsItem } from '../types/deck.js';
export interface CommandConvertContext {
    skippedNodes: string[];
    commandCount: number;
    skipForeignObject?: boolean;
}
export declare function svgElementToCommands(svgRoot: SVGSVGElement, ctx: CommandConvertContext): CommandsItem[];
//# sourceMappingURL=svg-to-commands.d.ts.map