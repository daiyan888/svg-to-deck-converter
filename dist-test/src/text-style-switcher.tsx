export const FONT_SIZE_PRESETS = [
  '9pt',
  '10.5pt',
  '12pt',
  '14pt',
  '18pt',
  '24pt',
  '36pt',
] as const;

interface TextStyleSwitcherProps {
  fontSize?: string | null;
  color?: string | null;
  swatchColors?: string[];
  onPreviewFontSize?: (fontSize: string) => void;
  onSelectFontSize: (fontSize: string) => void;
  onPreviewColor?: (color: string) => void;
  onSelectColor: (color: string) => void;
  onPreviewEnd?: () => void;
  disabled?: boolean;
}

export function TextStyleSwitcher({
  fontSize,
  color,
  swatchColors = [],
  onPreviewFontSize,
  onSelectFontSize,
  onPreviewColor,
  onSelectColor,
  onPreviewEnd,
  disabled = false,
}: TextStyleSwitcherProps) {
  return (
    <section className="textStyleSwitcher">
      <div className="textStyleHeader">
        <h2 className="textStyleTitle">字号 / 字体颜色</h2>
        <span className="textStyleMeta">
          {fontSize ?? '—'}
          {color ? ` · ${color}` : ''}
        </span>
      </div>

      <div className="textStyleRow" onMouseLeave={() => onPreviewEnd?.()}>
        <span className="textStyleLabel">字号</span>
        <div className="textStylePresets">
          {FONT_SIZE_PRESETS.map((size) => {
            const active = normalizeSize(fontSize) === normalizeSize(size);
            return (
              <button
                key={size}
                type="button"
                className={`textStylePresetBtn${active ? ' textStylePresetBtnActive' : ''}`}
                disabled={disabled}
                onClick={() => onSelectFontSize(size)}
                onMouseEnter={() => {
                  if (!disabled) {
                    onPreviewFontSize?.(size);
                  }
                }}
                title={`${size}（悬停预览，点击应用）`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="textStyleRow" onMouseLeave={() => onPreviewEnd?.()}>
        <span className="textStyleLabel">颜色</span>
        <div className="textStyleColorRow">
          <input
            type="color"
            className="textStyleColorInput"
            value={normalizeColorInput(color)}
            disabled={disabled}
            onInput={(e) => onPreviewColor?.((e.target as HTMLInputElement).value)}
            onChange={(e) => onSelectColor(e.target.value)}
            onBlur={() => onPreviewEnd?.()}
            title="悬停拖动预览，松开确认写入"
          />
          <code className="textStyleHex">{color ?? '—'}</code>
          {swatchColors.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className="textStyleSwatch"
              style={{ background: swatch.startsWith('#') ? swatch : undefined }}
              disabled={disabled}
              title={`${swatch}（悬停预览，点击应用）`}
              onClick={() => onSelectColor(swatch)}
              onMouseEnter={() => {
                if (!disabled) {
                  onPreviewColor?.(swatch);
                }
              }}
            />
          ))}
        </div>
      </div>

      <p className="textStyleHint">
        悬停仅预览（不改 JSON）；点击后写入全部文本节点的 <code>textStyle.fontSize</code> /
        <code>textGradientColor.color</code>。
      </p>
    </section>
  );
}

function normalizeSize(size: string | null | undefined): string {
  return (size ?? '').trim().toLowerCase();
}

function normalizeColorInput(color: string | null | undefined): string {
  const hex = (color ?? '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return '#000000';
}
