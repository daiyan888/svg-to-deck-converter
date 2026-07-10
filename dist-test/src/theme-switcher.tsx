import type { DeckTheme, ThemeColorSlot } from '../../dist/browser/index.js';
import { findPresetId, THEME_PRESETS, type ThemePreset } from './theme-presets';

const SWATCH_SLOTS: ThemeColorSlot[] = [
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
];

interface ThemeSwitcherProps {
  clrScheme?: DeckTheme | null;
  onSelectPreset: (preset: ThemePreset) => void;
  onSlotChange?: (slot: ThemeColorSlot, color: string) => void;
  disabled?: boolean;
}

export function ThemeSwitcher({
  clrScheme,
  onSelectPreset,
  onSlotChange,
  disabled = false,
}: ThemeSwitcherProps) {
  const activePresetId = findPresetId(clrScheme ?? undefined);

  return (
    <section className="themeSwitcher">
      <div className="themeSwitcherHeader">
        <h2 className="themeSwitcherTitle">主题色（clrScheme）</h2>
        {clrScheme && <span className="themeSwitcherName">{clrScheme.name}</span>}
      </div>

      <div className="themePresets">
        {THEME_PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              className={`themePresetBtn${active ? ' themePresetBtnActive' : ''}`}
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              title={preset.clrScheme.name}
            >
              <span className="themePresetSwatches" aria-hidden>
                {(['accent1', 'accent2', 'accent3', 'accent4'] as const).map((slot) => (
                  <span
                    key={slot}
                    className="themePresetDot"
                    style={{ background: preset.clrScheme[slot] }}
                  />
                ))}
              </span>
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {clrScheme && (
        <div className="themeSlots">
          {SWATCH_SLOTS.map((slot) => {
            const color = clrScheme[slot] ?? '#000000';
            return (
              <label key={slot} className="themeSlot">
                <span className="themeSlotName">{slot}</span>
                <span className="themeSlotControl">
                  <input
                    type="color"
                    className="themeColorInput"
                    value={normalizeColorInput(color)}
                    disabled={disabled || !onSlotChange}
                    onChange={(e) => onSlotChange?.(slot, e.target.value)}
                  />
                  <code className="themeSlotHex">{color}</code>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <p className="themeHint">
        转换时会把 AntV 色板映射为 accent1…6；切换主题只改 deck.attrs.theme.clrScheme，色槽引用会即时变色。
      </p>
    </section>
  );
}

function normalizeColorInput(color: string): string {
  const hex = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return '#000000';
}
