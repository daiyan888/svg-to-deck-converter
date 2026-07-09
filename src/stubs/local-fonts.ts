/** 浏览器 bundle 不包含本地字体拦截逻辑 */
export function ensureLocalFontFetchInstalled(): void {
  // no-op in browser
}

export function getLocalFontCssCount(): number {
  return 0;
}
