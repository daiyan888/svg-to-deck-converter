# svg-to-deck-converter

将 [AntV Infographic Gallery](https://infographic.antv.vision/gallery) 模板与自定义数据渲染为 SVG，并转换为 TipTap `deck` 节点 JSON。

## 安装

```bash
npm install svg-to-deck-converter @antv/infographic
```

## 主 API

```ts
import { convertInfographicToDeck } from 'svg-to-deck-converter';

const { svg, document, stats } = await convertInfographicToDeck({
  category: 'chart-bar',
  template: 'chart-bar-plain-text',
  data: {
    title: '年度营收增长',
    desc: '展示近三年及本年目标营收对比（单位：亿元）',
    values: [
      { label: '2021年', value: 120, desc: '转型初期', icon: 'lucide/sprout' },
      { label: '2022年', value: 150, desc: '平台优化', icon: 'lucide/zap' },
      { label: '2023年', value: 190, desc: '全面增长', icon: 'lucide/brain-circuit' },
      { label: '2024年', value: 240, desc: '冲击新高', icon: 'lucide/trophy' },
    ],
  },
  // 控制渲染尺寸（像素）。不传则默认 960 × 640
  width: 1200,
  height: 800,
  convertOptions: {
    extractText: true,
  },
  offsetTop: 0,
  offsetLeft: 0,
});
```

### 参数说明

| 字段 | 说明 |
|------|------|
| `category` | Gallery 类型 ID，如 `chart-bar` |
| `template` | 模板示例名（slug），如 `chart-bar-plain-text` |
| `data` | Infographic 图表数据 |
| `theme` | 可选，主题名称 |
| `useGalleryDefaults` | 默认 `true`，从 Gallery 拉取示例的 theme / design 默认值 |
| `convertOptions` | SVG → deck 转换选项，见下方说明 |
| `offsetTop` | 可选，所有 `deckNode` 的 `top` 统一偏移（像素），默认 `0`；优先级高于 `convertOptions.offsetTop` |
| `offsetLeft` | 可选，所有 `deckNode` 的 `left` 统一偏移（像素），默认 `0`；优先级高于 `convertOptions.offsetLeft` |
| `width` | 可选，目标输出宽度（像素），默认 `960`。Infographic 固有 viewBox 会按此拉伸到 deck / SVG |
| `height` | 可选，目标输出高度（像素），默认 `640`。同上 |

### 返回值

| 字段 | 说明 |
|------|------|
| `svg` | SDK 渲染出的 SVG 字符串（`width`/`height` 已写成目标像素，`viewBox` 仍为固有坐标系） |
| `document` | TipTap deck JSON（按目标尺寸等比 `meet` 适配：文本位置与字号同步缩放并居中留白） |
| `stats` | 转换统计（commands 数、text 节点数等） |

### 尺寸参数示例

`width` / `height` 写在入参对象顶层，单位为像素。

说明：`@antv/infographic` 的 `width`/`height` 只影响显示容器，**不会改变模板固有 `viewBox`**。本库会在转换后把 deck 与 SVG 适配到你指定的目标宽高：保留原始 `viewBox`，使用与 SVG 默认相同的等比缩放（`preserveAspectRatio=meet`）+ 居中留白；文本节点的 `left`/`top`/`width`/`height` 与字号按同一比例缩放，保证与图形对齐。

```ts
// 默认尺寸：960 × 640（不传 width / height）
await convertInfographicToDeck({
  category: 'chart-bar',
  template: 'chart-bar-plain-text',
  data: { /* ... */ },
});

// 放大：1200 × 800（deckNode.width/height 会变成 1200/800）
await convertInfographicToDeck({
  category: 'chart-bar',
  template: 'chart-bar-plain-text',
  data: { /* ... */ },
  width: 1200,
  height: 800,
});

// 缩小：640 × 480
await convertInfographicToDeck({
  category: 'chart-bar',
  template: 'chart-bar-plain-text',
  data: { /* ... */ },
  width: 640,
  height: 480,
});
```

## 从 Syntax 转换

若已有完整的 Infographic Syntax 字符串（与 [Gallery 编辑器](https://infographic.antv.vision/gallery) 或 [信息图语法](https://infographic.antv.vision/learn/infographic-syntax) 相同），可直接渲染并转换：

```ts
import { convertInfographicFromSyntax } from 'svg-to-deck-converter';

const syntax = `
infographic chart-bar-plain-text
data
  title 年度营收增长
  desc 展示近三年及本年目标营收对比（单位：亿元）
  values
    - label 2021年
      value 120
      desc 转型初期
      icon lucide/sprout
    - label 2022年
      value 150
      desc 平台优化
      icon lucide/zap
    - label 2023年
      value 190
      desc 全面增长
      icon lucide/brain-circuit
    - label 2024年
      value 240
      desc 冲击新高
      icon lucide/trophy
theme light
`.trim();

const { svg, document, stats, warnings } = await convertInfographicFromSyntax({
  syntax,
  // 控制渲染尺寸（像素）。不传则默认 960 × 640
  width: 1200,
  height: 800,
  convertOptions: {
    extractText: true,
  },
  offsetTop: 0,
  offsetLeft: 0,
});

// 也支持直接传入 syntax 字符串（此时无法传 width / height，会使用默认 960 × 640）
// await convertInfographicFromSyntax(syntax, { extractText: true, offsetTop: 0, offsetLeft: 0 });
```

### 参数说明

| 字段 | 说明 |
|------|------|
| `syntax` | 完整 Infographic Syntax 字符串 |
| `convertOptions` | SVG → deck 转换选项，见下方说明 |
| `offsetTop` | 可选，所有 `deckNode` 的 `top` 统一偏移（像素），默认 `0`；优先级高于 `convertOptions.offsetTop` |
| `offsetLeft` | 可选，所有 `deckNode` 的 `left` 统一偏移（像素），默认 `0`；优先级高于 `convertOptions.offsetLeft` |
| `width` | 可选，目标输出宽度（像素），默认 `960`。转换后会把 deck / SVG 拉伸到该尺寸 |
| `height` | 可选，目标输出高度（像素），默认 `640`。同上 |

### 返回值

与 `convertInfographicToDeck` 相同，额外包含 `warnings`（Syntax 解析警告，无问题时为空数组）。

### 尺寸参数示例

与 `convertInfographicToDeck` 相同：把 `width` / `height` 放在对象入参顶层，转换后 `deckNode` 会变成目标尺寸。若使用「直接传 syntax 字符串」的简写形式，则无法指定尺寸，会走默认 `960 × 640`。

```ts
// 默认尺寸：960 × 640
await convertInfographicFromSyntax({
  syntax,
});

// 放大：1440 × 900
await convertInfographicFromSyntax({
  syntax,
  width: 1440,
  height: 900,
});

// 缩小：480 × 360
await convertInfographicFromSyntax({
  syntax,
  width: 480,
  height: 360,
});

// ❌ 简写形式无法传尺寸，始终为默认 960 × 640
await convertInfographicFromSyntax(syntax, { extractText: true });
```

## convertOptions

`convertOptions` 用于控制 SVG → deck 的转换行为，适用于 `convertInfographicToDeck`、`convertInfographicFromSyntax` 和 `convertSvgToDeck`。

| 字段 | 说明 |
|------|------|
| `extractText` | 是否将 SVG `<text>` / `<tspan>` 提取为 `multiBlockContainer`，默认 `true` |
| `offsetTop` | 所有 `deckNode` 的 `top` 统一偏移（像素），默认 `0` |
| `offsetLeft` | 所有 `deckNode` 的 `left` 统一偏移（像素），默认 `0` |
| `defaultFontSize` | 文本提取时的默认字号，默认 `14` |
| `defaultFontFamily` | 文本提取时的默认字体，默认 `sans-serif` |

偏移会作用于 deck 下的**每一个** `deckNode`，包括 SVG 图形节点和提取出的文本节点。例如 `offsetTop: 100, offsetLeft: 50` 会将整张信息图整体下移 100px、右移 50px。

在 `convertInfographicToDeck` / `convertInfographicFromSyntax` 中，顶层 `offsetTop` / `offsetLeft` 与 `convertOptions` 同时传入时，以顶层参数为准。

## 其他 API

```ts
// 仅转换已有 SVG（同样支持 convertOptions.offsetTop / offsetLeft）
import { convertSvgToDeck } from 'svg-to-deck-converter';

const { document } = convertSvgToDeck(svgString, {
  extractText: true,
  offsetTop: 100,
  offsetLeft: 50,
});

// 获取 Gallery 分类与模板列表
import { getGalleryCategories } from 'svg-to-deck-converter';
```

## 本地开发（测试页面）

```bash
npm install
npm run dev
```

`dev/` 目录是本地调试用的 React 页面，可交互测试模板选择、Syntax 编辑、SDK 预览与 TipTap 渲染。

## 构建 npm 包

```bash
npm run build
```

使用 `tsc` 将 `src/` 编译为 `dist/`（`.js` + `.d.ts`）。

## 项目结构

```
src/                  # npm 包源码
├── index.ts          # 导出入口
├── convert-infographic-to-deck.ts
├── converter/        # SVG → deck JSON
├── gallery/          # Gallery 模板与渲染
└── types/

dev/                  # 本地开发测试页面
├── components/
├── tiptap/
└── renderer/
```

## deck JSON 结构

```
deck
└── deckNode (width, height, top, left)
    ├── svg (commands[])
    └── multiBlockContainer
        └── paragraph → text + textStyle
```
