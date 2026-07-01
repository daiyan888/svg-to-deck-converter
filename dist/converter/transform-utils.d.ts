export interface ViewBoxInfo {
    minX: number;
    minY: number;
    width: number;
    height: number;
    /** 原始 viewBox 字符串，用于 svg 渲染 */
    viewBox: string;
}
export declare function parseViewBox(svg: SVGSVGElement): ViewBoxInfo;
export declare function parseTransform(transform: string | null | undefined): {
    tx: number;
    ty: number;
};
/** 从元素到 svg 根，累加 transform / x / y 得到 SVG 用户坐标系下的锚点 */
export declare function getAbsoluteAnchor(el: Element): {
    x: number;
    y: number;
};
export declare function parseStyleValue(style: string, prop: string): string | undefined;
//# sourceMappingURL=transform-utils.d.ts.map