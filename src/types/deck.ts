/** TipTap deck 节点 JSON 结构类型定义 */

/** textStyle.lineHeight 默认值；渲染时 p 的 --data-line-height = lineHeight * 此系数 */
export const DEFAULT_TEXT_STYLE_LINE_HEIGHT = 1.2;
/** 渲染系数：CSS 行高 = textStyle.lineHeight × LINE_HEIGHT_RENDER_FACTOR */
export const LINE_HEIGHT_RENDER_FACTOR = 1.2;

/** paragraph.textAlign 默认值；渲染到 p 的 text-align */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export const DEFAULT_PARAGRAPH_TEXT_ALIGN: TextAlign = 'left';

/** multiBlockContainer.verticalAlign；渲染为 align-items */
export type VerticalAlign = 'start' | 'center' | 'end';
export const DEFAULT_MULTI_BLOCK_VERTICAL_ALIGN: VerticalAlign = 'start';

export interface TextStyleMark {
  type: 'textStyle';
  attrs: {
    fontFamily: string;
    fontSize: string;
    /** 逻辑行高，默认 1.2；渲染为 CSS 行高时乘以 LINE_HEIGHT_RENDER_FACTOR */
    lineHeight: number;
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
    /** 水平对齐，渲染为 p 的 text-align */
    textAlign?: TextAlign;
  };
  content: TextNode[];
}

export const DEFAULT_MULTI_BLOCK_CONTAINER_PADDING = '0px 0px 0px 0px';

export interface MultiBlockContainerNode {
  type: 'multiBlockContainer';
  attrs: {
    padding: string;
    /** 垂直对齐，渲染为 align-items */
    verticalAlign: VerticalAlign;
  };
  content: ParagraphNode[];
}

export type CommandAttributeValue = string | number | boolean;

/** SVG 绘制指令，图形属性与 comp 同级展开 */
export interface CommandsItem {
  comp: string;
  children?: CommandsItem[];
  /**
   * 保留原始子节点 markup（用于 extractText=false 时的 text / tspan / foreignObject）。
   * 渲染时原样写入元素内容，不作为 HTML 属性输出。
   */
  innerHTML?: string;
  [attr: string]: CommandAttributeValue | CommandsItem[] | undefined;
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

export type DeckNodeChild = SvgNode | MultiBlockContainerNode;

export interface DeckNode {
  type: 'deckNode';
  attrs: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  /** 每个 deckNode 只能有一个子节点（svg 或 multiBlockContainer） */
  content: [DeckNodeChild];
}

/** PPT 风格主题色槽（对应 a:clrScheme） */
export type ThemeColorSlot =
  | 'dk1'
  | 'dk2'
  | 'lt1'
  | 'lt2'
  | 'accent1'
  | 'accent2'
  | 'accent3'
  | 'accent4'
  | 'accent5'
  | 'accent6'
  | 'hlink'
  | 'folHlink';

/** 主题色方案，颜色值为 CSS 色值（如 #4472C4） */
export interface DeckTheme {
  /** 主题名称，如 Office、自定义品牌名 */
  name: string;
  dk1: string;
  dk2: string;
  lt1: string;
  lt2: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  hlink?: string;
  folHlink?: string;
}

/** deck.attrs.theme 结构 */
export interface DeckThemeConfig {
  clrScheme: DeckTheme;
}

export interface DeckDocumentAttrs {
  theme: DeckThemeConfig;
}

export interface DeckDocument {
  type: 'deck';
  attrs: DeckDocumentAttrs;
  content: DeckNode[];
}

export interface ConvertOptions {
  /** 所有 deckNode 的 top/left 统一偏移，默认 0 */
  offsetTop?: number;
  offsetLeft?: number;
  /**
   * 是否将 SVG `<text>` / `<tspan>` / `foreignObject` 文本提取为 multiBlockContainer，默认 true。
   * 为 false 时文本保留在 svg.commands 内（含 foreignObject 的 HTML 内容）。
   */
  extractText?: boolean;
  /** 默认字号（无法从 SVG 解析时） */
  defaultFontSize?: number;
  /** 默认字体 */
  defaultFontFamily?: string;
  /**
   * 写入 deck.attrs.theme；若同时开启 mapColorsToThemeSlots，会按此 clrScheme 做 hex→色槽映射。
   * 不传则使用默认 Office 主题。
   */
  theme?: DeckThemeConfig;
  /**
   * 是否将 SVG / 文本中的颜色字面量映射为主题色槽（accent1…、dk1…），默认 false。
   * 仅当提供了 theme（或 Infographic 路径自动构建了 theme）时才会生效。
   */
  mapColorsToThemeSlots?: boolean;
}

export interface ConvertResult {
  document: DeckDocument;
  stats: {
    commandCount: number;
    textNodeCount: number;
    skippedNodes: string[];
  };
}
