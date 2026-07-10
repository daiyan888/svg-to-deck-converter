import {
  getPalette,
  getTheme,
  getThemeColors,
  type Palette,
  type ThemeConfig,
} from '@antv/infographic';
import type { DeckTheme, DeckThemeConfig, ThemeColorSlot } from '../types/deck.js';
import { normalizeColorHex } from './color-normalize.js';

const ACCENT_SLOTS: ThemeColorSlot[] = [
  'accent1',
  'accent2',
  'accent3',
  'accent4',
  'accent5',
  'accent6',
];

function uniqueColors(colors: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const color of colors) {
    const hex = normalizeColorHex(color);
    if (!hex || seen.has(hex)) {
      continue;
    }
    seen.add(hex);
    // 保留原始写法（优先 hex）
    result.push(color.startsWith('#') ? hex : color);
  }
  return result;
}

/** 将 AntV palette 解析为离散色值列表 */
export function resolvePaletteColors(palette: Palette | undefined, sampleCount = 12): string[] {
  if (palette == null) {
    return [];
  }

  if (typeof palette === 'string') {
    return resolvePaletteColors(getPalette(palette), sampleCount);
  }

  if (Array.isArray(palette)) {
    return palette.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
  }

  if (typeof palette === 'function') {
    const colors: string[] = [];
    for (let i = 0; i < sampleCount; i += 1) {
      const color = palette(sampleCount > 1 ? i / (sampleCount - 1) : 0, i, sampleCount);
      if (typeof color === 'string' && color.trim()) {
        colors.push(color);
      }
    }
    return colors;
  }

  return [];
}

export interface BuildDeckThemeFromInfographicInput {
  /** AntV 主题名，如 light / dark */
  theme?: string;
  themeConfig?: ThemeConfig;
  /** clrScheme.name，默认用 theme 名或 custom */
  name?: string;
}

/**
 * 从 AntV theme / themeConfig 构建 PPT 风格 clrScheme。
 * accent1…6 优先取 palette（与图表系列色一致），不足时用 colorPrimary 补齐。
 */
export function buildDeckThemeFromInfographic(
  input: BuildDeckThemeFromInfographicInput = {},
): DeckThemeConfig {
  const base = input.theme ? (getTheme(input.theme) ?? {}) : {};
  const merged: ThemeConfig = {
    ...base,
    ...input.themeConfig,
    // 与 @antv/infographic 运行时默认一致
    palette: input.themeConfig?.palette ?? base.palette ?? 'antv',
  };

  const colorPrimary = merged.colorPrimary ?? '#FF356A';
  const colorBg = merged.colorBg ?? '#ffffff';
  const themeColors = getThemeColors({ colorPrimary, colorBg });
  const paletteColors = resolvePaletteColors(merged.palette);

  // 系列色优先进入 accent；主色若不在色板中则追加到末尾可用槽位前
  const accentSource = uniqueColors(
    paletteColors.length > 0 ? [...paletteColors, colorPrimary] : [colorPrimary],
  );
  while (accentSource.length < 6) {
    accentSource.push(accentSource[accentSource.length - 1] ?? colorPrimary);
  }

  const clrScheme: DeckTheme = {
    name: input.name ?? input.theme ?? 'custom',
    dk1: normalizeColorHex(themeColors.colorText) ?? themeColors.colorText,
    dk2: normalizeColorHex(themeColors.colorTextSecondary) ?? themeColors.colorTextSecondary,
    lt1: normalizeColorHex(themeColors.colorBg) ?? themeColors.colorBg,
    lt2: normalizeColorHex(themeColors.colorBgElevated) ?? themeColors.colorBgElevated,
    accent1: normalizeColorHex(accentSource[0]) ?? accentSource[0],
    accent2: normalizeColorHex(accentSource[1]) ?? accentSource[1],
    accent3: normalizeColorHex(accentSource[2]) ?? accentSource[2],
    accent4: normalizeColorHex(accentSource[3]) ?? accentSource[3],
    accent5: normalizeColorHex(accentSource[4]) ?? accentSource[4],
    accent6: normalizeColorHex(accentSource[5]) ?? accentSource[5],
    hlink: '#0563C1',
    folHlink: '#954F72',
  };

  return { clrScheme };
}

/** 由 clrScheme 生成 hex → 色槽 反查表（后写覆盖先写时按优先级：语义色优先于 accent） */
export function buildColorSlotLookup(clrScheme: DeckTheme): Map<string, ThemeColorSlot> {
  const map = new Map<string, ThemeColorSlot>();

  // accents 先写入，语义色后写入以覆盖冲突（正文黑优先于偶然相同的 accent）
  for (const slot of ACCENT_SLOTS) {
    const value = clrScheme[slot];
    if (!value) {
      continue;
    }
    const hex = normalizeColorHex(value);
    if (hex) {
      map.set(hex, slot);
    }
  }

  const semantic: ThemeColorSlot[] = ['lt2', 'lt1', 'dk2', 'dk1', 'hlink', 'folHlink'];
  for (const slot of semantic) {
    const value = clrScheme[slot];
    if (!value) {
      continue;
    }
    const hex = normalizeColorHex(value);
    if (hex) {
      map.set(hex, slot);
    }
  }

  return map;
}
