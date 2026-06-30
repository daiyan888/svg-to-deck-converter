# SVG → TipTap Deck 转换器

将 [AntV Infographic Gallery](https://infographic.antv.vision/gallery) 等来源的 SVG 图表，转换为 TipTap `deck` 节点 JSON 结构。

## 目标 JSON 结构

```
deck
└── deckNode (width, height, top, left)
    ├── svg (width, height, commands[])
    │   └── commandsItem { comp, props, children? }
    └── multiBlockContain
        └── paragraph
            └── text + textStyle mark (fontFamily, fontSize)
```

### comp 白名单

`g` / `animate` / `ellipse` / `circle` / `polygon` / `rect` / `path` / `linearGradient` / `stop`

- 有子元素但不在白名单 → `g`
- 叶子节点但不在白名单 → `path`

另扩展支持：`defs`、`clipPath`、`line`、`polyline`、`radialGradient` 等。

## 使用方式

```bash
cd D:\code\work\svg-to-deck-converter
npm install
npm run dev
```

1. 打开 [AntV Infographic Gallery](https://infographic.antv.vision/gallery) 任意图表示例
2. 在浏览器开发者工具中选中渲染出的 `<svg>` 元素，复制 outerHTML
3. 粘贴到左侧输入框，点击「转换」
4. 右侧获得 deck JSON，底部可预览重新渲染效果

## 编程式调用

```ts
import { convertSvgToDeck } from './converter/svg-to-deck';

const { document, stats } = convertSvgToDeck(svgString, {
  extractText: true,       // 将 <text> 提取为 multiBlockContain
  defaultFontSize: 14,
  defaultFontFamily: 'sans-serif',
});
```

## 项目结构

```
src/
├── types/deck.ts              # TipTap 节点类型
├── converter/
│   ├── svg-to-deck.ts         # 主入口
│   ├── svg-to-commands.ts     # SVG 元素 → commands
│   ├── text-extractor.ts      # <text> → multiBlockContain
│   └── attribute-utils.ts     # 属性解析
├── renderer/                  # JSON 预览渲染
└── components/converter-panel.tsx
```
