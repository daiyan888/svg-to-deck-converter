/**
 * 浏览器 bundle 不依赖 measury（Node SSR 量字库）。
 * AntV / measure-font 的导入经 tsup alias 落到此处。
 */

export type FontData = {
  fontFamily: string;
  aliases?: string[];
  fontWeight: string | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  unitsPerEm: number;
  metrics: {
    ascender: number;
    descender: number;
    lineGap?: number;
  };
  glyphs?: Record<string, number>;
  defaultWidth?: number;
};

export type TextStyle = {
  fontSize?: number | string;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  letterSpacing?: number;
  wordSpacing?: number;
  lineHeight?: number;
};

export type TextMetrics = {
  width: number;
  height: number;
  baseline: number;
};

export function registerFont(_font: FontData): void {
  // no-op in browser
}

export function setDefaultFontFamily(_fontFamily: string): void {
  // no-op in browser
}

export function getFontData(_fontFamily?: string): FontData | undefined {
  return undefined;
}

export function measureText(
  _text: string,
  style: TextStyle = {},
): TextMetrics {
  const raw = style.fontSize ?? 16;
  const fontSize = typeof raw === 'number' ? raw : parseFloat(raw) || 16;
  return { width: 0, height: fontSize, baseline: fontSize * 0.8 };
}
