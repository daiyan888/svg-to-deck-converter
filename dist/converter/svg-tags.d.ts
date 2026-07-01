/** 用户定义的 comp 白名单；不在列表中的叶子节点默认 path，有子节点默认 g */
export declare const KNOWN_COMPS: Set<string>;
/** 额外支持的 SVG 标签（保持原标签名，不强制转 path） */
export declare const EXTENDED_COMPS: Set<string>;
export declare function resolveComp(tagName: string, hasElementChildren: boolean): string;
export declare function isTextElement(tagName: string): boolean;
export declare function isSkippableRoot(tagName: string): boolean;
//# sourceMappingURL=svg-tags.d.ts.map