/**
 * ESM 消费者示例（本文件是 .mjs，不依赖 package.json 的 "type"）
 *
 * 运行：npm run test:esm
 */
import { getDeckNodes } from 'dist-use';

const syntax = `
infographic chart-bar-plain-text
data
  title dist-use-use ESM
  desc Node ESM 调用 getDeckNodes
  values
    - label A
      value 10
    - label B
      value 20
theme light
`.trim();

const result = await getDeckNodes({
  syntax,
  width: 640,
  height: 400,
  mapColorsToThemeSlots: true,
});

console.log('[esm] ok');
console.log('[esm] theme:', result.document.attrs.theme.clrScheme.name);
console.log('[esm] accent1:', result.document.attrs.theme.clrScheme.accent1);
console.log('[esm] nodes:', result.document.content.length);
console.log('[esm] commands:', result.stats.commandCount);
console.log('[esm] svg length:', result.svg.length);
