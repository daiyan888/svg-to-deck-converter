export interface ParsedTextColor {
    color?: string;
    textGradientColor?: string;
}
export declare function parseTextColorFromStyle(style: string): ParsedTextColor;
export declare function parseTextColorFromFill(fill: string | undefined, svgRoot: SVGSVGElement): ParsedTextColor;
export declare function parseTextColor(options: {
    fill?: string;
    style?: string;
    svgRoot?: SVGSVGElement;
}): ParsedTextColor;
//# sourceMappingURL=color-utils.d.ts.map