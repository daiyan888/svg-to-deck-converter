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
  /** 已落盘的 clrScheme（来自 deck.attrs.theme） */
  clrScheme?: DeckTheme | null;
  /** 点击预设：写入数据结构 */
  onSelectPreset: (preset: ThemePreset) => void;
  /** 悬停预设：仅预览，不改数据 */
  onPreviewPreset?: (preset: ThemePreset) => void;
  /** 离开预设 / 结束预览 */
  onPreviewEnd?: () => void;
  /** 色槽取色确认：写入数据结构 */
  onSlotChange?: (slot: ThemeColorSlot, color: string) => void;
  /** 色槽拖动中：仅预览 */
  onSlotPreview?: (slot: ThemeColorSlot, color: string) => void;
  disabled?: boolean;
}

export function ThemeSwitcher({
  clrScheme,
  onSelectPreset,
  onPreviewPreset,
  onPreviewEnd,
  onSlotChange,
  onSlotPreview,
  disabled = false,
}: ThemeSwitcherProps) {
  const activePresetId = findPresetId(clrScheme ?? undefined);

  return (
    <section className="themeSwitcher">
      <div className="themeSwitcherHeader">
        <h2 className="themeSwitcherTitle">主题色（clrScheme）</h2>
        {clrScheme && <span className="themeSwitcherName">{clrScheme.name}</span>}
      </div>

      <div className="themePresets" onMouseLeave={() => onPreviewEnd?.()}>
        {THEME_PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              className={`themePresetBtn${active ? ' themePresetBtnActive' : ''}`}
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              onMouseEnter={() => {
                if (!disabled) {
                  onPreviewPreset?.(preset);
                }
              }}
              title={`${preset.clrScheme.name}（悬停预览，点击应用）`}
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
                    onInput={(e) =>
                      onSlotPreview?.(slot, (e.target as HTMLInputElement).value)
                    }
                    onChange={(e) => onSlotChange?.(slot, e.target.value)}
                    onBlur={() => onPreviewEnd?.()}
                  />
                  <code className="themeSlotHex">{color}</code>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <p className="themeHint">
        悬停预设仅预览（不改 JSON）；点击后才写入 <code>deck.attrs.theme.clrScheme</code>。
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
