/**
 * CJS 消费者示例（本文件是 .cjs；package.json 故意没有 "type":"module"）
 *
 * 运行：npm run test:cjs
 *
 * 关键点：这里用 require('dist-use')，会走到 getDeckNodes.cjs，
 * 再由 svg-to-deck-converter 的 exports 选到 dist/node/index.cjs。
 */
const { getDeckNodes } = require('dist-use');

const syntax = `
infographic chart-bar-plain-text
data
  title dist-use-use CJS
  desc Node CJS 调用 getDeckNodes
  values
    - label A
      value 10
    - label B
      value 20
theme light
`.trim();

async function main() {
  const result = await getDeckNodes({
    syntax,
    width: 640,
    height: 400,
    mapColorsToThemeSlots: true,
  });

  console.log('[cjs] ok');
  console.log('[cjs] theme:', result.document.attrs.theme.clrScheme.name);
  console.log('[cjs] accent1:', result.document.attrs.theme.clrScheme.accent1);
  console.log('[cjs] nodes:', result.document.content.length);
  console.log('[cjs] commands:', result.stats.commandCount);
  console.log('[cjs] svg length:', result.svg.length);
}

main().catch((error) => {
  console.error('[cjs] failed:', error);
  process.exitCode = 1;
});
