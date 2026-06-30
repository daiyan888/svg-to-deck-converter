/** TipTap deck 节点 JSON 结构类型定义 */

export interface TextStyleMark {
  type: 'textStyle';
  attrs: {
    fontFamily: string;
    fontSize: number;
  };
}

export interface TextGradientColorMark {
  type: 'textGradientColor';
  attrs: {
    color: string | null;
    textGradientColor: string | null;
  };
}

export type TextMark = TextStyleMark | TextGradientColorMark;

export interface TextNode {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

export interface ParagraphNode {
  type: 'paragraph';
  attrs?: {
    textAlign?: 'left' | 'center' | 'right';
  };
  content: TextNode[];
}

export interface MultiBlockContainNode {
  type: 'multiBlockContain';
  content: ParagraphNode[];
}

export interface CommandsItem {
  comp: string;
  props: Record<string, string | number | boolean>;
  children?: CommandsItem[];
}

export interface SvgNode {
  type: 'svg';
  attrs: {
    width: number;
    height: number;
    viewBox?: string;
    commands: CommandsItem[];
  };
}

export type DeckNodeChild = SvgNode | MultiBlockContainNode;

export interface DeckNode {
  type: 'deckNode';
  attrs: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  /** 每个 deckNode 只能有一个子节点（svg 或 multiBlockContain） */
  content: [DeckNodeChild];
}

export interface DeckDocument {
  type: 'deck';
  content: DeckNode[];
}

export interface ConvertOptions {
  /** deckNode 在 deck 内的偏移，默认 0 */
  offsetTop?: number;
  offsetLeft?: number;
  /** 是否将 SVG <text>/<tspan> 提取为 multiBlockContain，默认 true */
  extractText?: boolean;
  /** 默认字号（无法从 SVG 解析时） */
  defaultFontSize?: number;
  /** 默认字体 */
  defaultFontFamily?: string;
}

export interface ConvertResult {
  document: DeckDocument;
  stats: {
    commandCount: number;
    textNodeCount: number;
    skippedNodes: string[];
  };
}
