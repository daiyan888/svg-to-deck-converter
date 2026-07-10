import type { DeckTheme, ThemeColorSlot } from 'svg-to-deck-converter';
import { findPresetId, THEME_PRESETS, type ThemePreset } from '../theme/presets';
import styles from './theme-switcher.module.css';

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
  /** 当前生效的 clrScheme（来自 deck.attrs.theme） */
  clrScheme?: DeckTheme | null;
  /** 切换预设主题 */
  onSelectPreset: (preset: ThemePreset) => void;
  /** 修改单个色槽 */
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
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>主题色（clrScheme）</h2>
        {clrScheme && (
          <span className={styles.themeName}>{clrScheme.name}</span>
        )}
      </div>

      <div className={styles.presets}>
        {THEME_PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetBtn} ${active ? styles.presetBtnActive : ''}`}
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              title={preset.clrScheme.name}
            >
              <span className={styles.presetSwatches} aria-hidden>
                {(['accent1', 'accent2', 'accent3', 'accent4'] as const).map((slot) => (
                  <span
                    key={slot}
                    className={styles.presetDot}
                    style={{ background: preset.clrScheme[slot] }}
                  />
                ))}
              </span>
              <span className={styles.presetLabel}>{preset.label}</span>
            </button>
          );
        })}
      </div>

      {clrScheme && (
        <div className={styles.slots}>
          {SWATCH_SLOTS.map((slot) => {
            const color = clrScheme[slot] ?? '#000000';
            return (
              <label key={slot} className={styles.slot}>
                <span className={styles.slotName}>{slot}</span>
                <span className={styles.slotControl}>
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={normalizeColorInput(color)}
                    disabled={disabled || !onSlotChange}
                    onChange={(e) => onSlotChange?.(slot, e.target.value)}
                  />
                  <code className={styles.slotHex}>{color}</code>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <p className={styles.hint}>
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
