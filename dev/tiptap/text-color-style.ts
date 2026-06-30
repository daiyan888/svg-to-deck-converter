export interface TextColorAttrs {
  color?: string | null;
  textGradientColor?: string | null;
}

export function buildTextColorCss(attrs: TextColorAttrs): Record<string, string> | undefined {
  const { color, textGradientColor } = attrs;
  if (textGradientColor) {
    return {
      background: textGradientColor,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    };
  }
  if (color) {
    return { color };
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
