/** 将 CSS 颜色规范为 #RRGGBB（小写）；无法解析时返回 null */

const SKIP = new Set(['none', 'transparent', 'currentcolor', 'inherit', 'initial', 'unset']);

export interface NormalizedColor {
  /** #rrggbb */
  hex: string;
  /** 0–1，缺省视为 1 */
  alpha: number;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHexByte(n: number): string {
  return clampByte(n).toString(16).padStart(2, '0');
}

function parseHexColor(raw: string): NormalizedColor | null {
  const hex = raw.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    const r = hex[0];
    const g = hex[1];
    const b = hex[2];
    const a = hex.length === 4 ? hex[3] : null;
    return {
      hex: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(),
      alpha: a != null ? parseInt(a + a, 16) / 255 : 1,
    };
  }
  if (hex.length === 6 || hex.length === 8) {
    const rgb = hex.slice(0, 6).toLowerCase();
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { hex: `#${rgb}`, alpha };
  }
  return null;
}

function parseRgbColor(raw: string): NormalizedColor | null {
  const match = raw.match(
    /^rgba?\(\s*([0-9.]+%?)\s*[, ]\s*([0-9.]+%?)\s*[, ]\s*([0-9.]+%?)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/i,
  );
  if (!match) {
    return null;
  }

  const parseChannel = (value: string): number => {
    if (value.endsWith('%')) {
      return (parseFloat(value) / 100) * 255;
    }
    return parseFloat(value);
  };

  const r = parseChannel(match[1]);
  const g = parseChannel(match[2]);
  const b = parseChannel(match[3]);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return null;
  }

  let alpha = 1;
  if (match[4] != null) {
    const aRaw = match[4];
    alpha = aRaw.endsWith('%') ? parseFloat(aRaw) / 100 : parseFloat(aRaw);
    if (Number.isNaN(alpha)) {
      alpha = 1;
    }
  }

  return {
    hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
    alpha,
  };
}

export function normalizeColor(value: string): NormalizedColor | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || SKIP.has(trimmed)) {
    return null;
  }
  if (trimmed.startsWith('url(') || trimmed.startsWith('var(')) {
    return null;
  }
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }
  if (trimmed.startsWith('rgb')) {
    return parseRgbColor(trimmed);
  }
  return null;
}

/** 规范化为 #rrggbb；失败返回 null */
export function normalizeColorHex(value: string): string | null {
  return normalizeColor(value)?.hex ?? null;
}
