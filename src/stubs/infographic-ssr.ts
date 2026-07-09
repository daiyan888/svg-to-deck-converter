/** 浏览器 bundle 不包含 SSR；Node 端请加载 index.node.js */
export function renderToString(): never {
  throw new Error(
    [
      '当前加载的是浏览器 bundle（dist/index.js），其中不包含 @antv/infographic/ssr。',
      '在 Node 中请改为：',
      '  import { convertInfographicFromSyntax } from ".../dist/index.node.js"',
      '或通过 npm 包名导入（package.json exports 的 node 条件会解析到 index.node.js）。',
      '浏览器环境请继续使用 dist/index.js，并确保存在 document（走 DOM 渲染）。',
    ].join('\n'),
  );
}
