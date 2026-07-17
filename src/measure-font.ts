/**
 * Node SSR 文本宽度依赖 measury 字形度量。
 * `Microsoft YaHei` / `微软雅黑` 在渲染前自动挂上与 Alibaba PuHuiTi 相同的 CJK 度量，
 * 避免回退 Arial 导致文字 deckNode 宽度错乱。业务侧无需注册。
 */

import { registerFont, type FontData } from 'measury';
import AlibabaPuHuiTi from 'measury/fonts/AlibabaPuHuiTi-Regular';

/** Syntax / theme 里常见的雅黑写法 → 自动识别 */
const MICROSOFT_YAHEI_ALIASES = [
  '微软雅黑',
  'Microsoft YaHei UI',
  '微软雅黑 UI',
  '微软雅黑UI',
  'MicrosoftYaHei',
] as const;

let systemFontAliasesInstalled = false;

/**
 * 为 Node SSR 挂上系统中文字体别名（幂等）。
 * 由 `renderInfographicSvg`（Node 路径）自动调用；一般无需业务侧手动调用。
 */
export function ensureSystemFontMeasureAliases(): void {
  if (systemFontAliasesInstalled) {
    return;
  }
  systemFontAliasesInstalled = true;

  const base = AlibabaPuHuiTi as FontData;
  registerFont(base);
  registerFont({
    ...base,
    fontFamily: 'Microsoft YaHei',
    aliases: [...MICROSOFT_YAHEI_ALIASES],
  });
}
