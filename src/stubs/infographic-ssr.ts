/** 浏览器 bundle 不包含 SSR，Node 端渲染请使用 node 条件导出 */
export function renderToString(): never {
  throw new Error(
    'renderInfographicSvg 的 Node/SSR 路径未包含在浏览器 bundle 中，请在 Node 环境使用 package exports 的 node 条件',
  );
}
