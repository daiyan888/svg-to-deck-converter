import type { DeckTheme, DeckThemeConfig, ThemeColorSlot } from '../types/deck.js';

export const THEME_COLOR_SLOTS: readonly ThemeColorSlot[] = [
  'dk1',
  'dk2',
  'lt1',
  'lt2',
  'accent1',
  'accent2',
  'accent3',
  'accent4',
  'accent5',
  'accent6',
  'hlink',
  'folHlink',
] as const;

/** 默认 Office 风格色板 */
export const DEFAULT_DECK_THEME: DeckTheme = {
  name: 'Office',
  dk1: '#000000',
  dk2: '#44546A',
  lt1: '#FFFFFF',
  lt2: '#E7E6E6',
  accent1: '#4472C4',
  accent2: '#ED7D31',
  accent3: '#A5A5A5',
  accent4: '#FFC000',
  accent5: '#5B9BD5',
  accent6: '#70AD47',
  hlink: '#0563C1',
  folHlink: '#954F72',
};

export const DEFAULT_DECK_THEME_CONFIG: DeckThemeConfig = {
  clrScheme: DEFAULT_DECK_THEME,
};

const SLOT_SET = new Set<string>(THEME_COLOR_SLOTS);

export function isThemeColorSlot(value: string): value is ThemeColorSlot {
  return SLOT_SET.has(value);
}

/** 将色槽解析为 clrScheme 中的实际色值；非色槽原样返回 */
export function resolveThemeColor(
  value: string | null | undefined,
  clrScheme: DeckTheme,
): string | null | undefined {
  if (value == null || value === '') {
    return value;
  }
  if (!isThemeColorSlot(value)) {
    return value;
  }
  return clrScheme[value] ?? value;
}

/** 生成挂在 deck 容器上的 CSS 变量（--dk1、--accent1 …） */
export function buildClrSchemeCssVars(clrScheme: DeckTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const slot of THEME_COLOR_SLOTS) {
    const color = clrScheme[slot];
    if (color) {
      vars[`--${slot}`] = color;
    }
  }
  return vars;
}

/** 色槽 → CSS var(--accent1)；字面色值原样返回 */
export function toThemeCssValue(value: string): string {
  if (isThemeColorSlot(value)) {
    return `var(--${value})`;
  }
  return value;
}
