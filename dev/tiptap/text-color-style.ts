import { toThemeCssValue } from 'svg-to-deck-converter';

export interface TextColorAttrs {
  color?: string | null;
  textGradientColor?: string | null;
}

/** 将渐变字符串中的主题色槽替换为 CSS var */
function resolveGradientThemeSlots(gradient: string): string {
  return gradient.replace(
    /\b(dk[12]|lt[12]|accent[1-6]|hlink|folHlink)\b/g,
    (slot) => toThemeCssValue(slot),
  );
}

export function buildTextColorCss(attrs: TextColorAttrs): Record<string, string> | undefined {
  const { color, textGradientColor } = attrs;
  if (textGradientColor) {
    return {
      background: resolveGradientThemeSlots(textGradientColor),
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    };
  }
  if (color) {
    return { color: toThemeCssValue(color) };
  }
  return undefined;
}

export function buildTextColorStyleString(attrs: TextColorAttrs): string {
  const css = buildTextColorCss(attrs);
  if (!css) {
    return '';
  }
  return Object.entries(css)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
    .join(';');
}
