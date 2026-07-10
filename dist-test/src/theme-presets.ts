import type { DeckTheme, DeckThemeConfig } from '../../dist/index.js';
import { DEFAULT_DECK_THEME } from '../../dist/index.js';

export interface ThemePreset {
  id: string;
  label: string;
  clrScheme: DeckTheme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'office',
    label: 'Office',
    clrScheme: { ...DEFAULT_DECK_THEME },
  },
  {
    id: 'antv',
    label: 'AntV',
    clrScheme: {
      name: 'AntV',
      dk1: '#262626',
      dk2: '#595959',
      lt1: '#ffffff',
      lt2: '#f5f5f5',
      accent1: '#1783ff',
      accent2: '#00c9c9',
      accent3: '#f0884d',
      accent4: '#d580ff',
      accent5: '#7863ff',
      accent6: '#60c42d',
      hlink: '#0563C1',
      folHlink: '#954F72',
    },
  },
  {
    id: 'brand-blue',
    label: 'Brand Blue',
    clrScheme: {
      name: 'Brand Blue',
      dk1: '#0f172a',
      dk2: '#334155',
      lt1: '#ffffff',
      lt2: '#f1f5f9',
      accent1: '#2563eb',
      accent2: '#7c3aed',
      accent3: '#db2777',
      accent4: '#ea580c',
      accent5: '#0891b2',
      accent6: '#16a34a',
      hlink: '#1d4ed8',
      folHlink: '#7e22ce',
    },
  },
  {
    id: 'warm',
    label: 'Warm',
    clrScheme: {
      name: 'Warm',
      dk1: '#1c1917',
      dk2: '#57534e',
      lt1: '#fffbeb',
      lt2: '#fef3c7',
      accent1: '#ea580c',
      accent2: '#dc2626',
      accent3: '#ca8a04',
      accent4: '#d97706',
      accent5: '#b45309',
      accent6: '#78716c',
      hlink: '#c2410c',
      folHlink: '#9a3412',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    clrScheme: {
      name: 'Forest',
      dk1: '#14532d',
      dk2: '#166534',
      lt1: '#f0fdf4',
      lt2: '#dcfce7',
      accent1: '#16a34a',
      accent2: '#0d9488',
      accent3: '#65a30d',
      accent4: '#059669',
      accent5: '#84cc16',
      accent6: '#a3e635',
      hlink: '#15803d',
      folHlink: '#166534',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    clrScheme: {
      name: 'Dark',
      dk1: '#f8fafc',
      dk2: '#cbd5e1',
      lt1: '#0f172a',
      lt2: '#1e293b',
      accent1: '#38bdf8',
      accent2: '#a78bfa',
      accent3: '#fb7185',
      accent4: '#fbbf24',
      accent5: '#34d399',
      accent6: '#f472b6',
      hlink: '#7dd3fc',
      folHlink: '#c4b5fd',
    },
  },
];

export function toThemeConfig(clrScheme: DeckTheme): DeckThemeConfig {
  return { clrScheme };
}

export function findPresetId(clrScheme: DeckTheme | undefined): string | null {
  if (!clrScheme) {
    return null;
  }
  const match = THEME_PRESETS.find(
    (preset) =>
      preset.clrScheme.name === clrScheme.name &&
      preset.clrScheme.accent1.toLowerCase() === clrScheme.accent1.toLowerCase(),
  );
  return match?.id ?? null;
}
