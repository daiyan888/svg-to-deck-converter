# svg-to-deck-converter

将 [AntV Infographic Gallery](https://infographic.antv.vision/gallery) 模板与自定义数据渲染为 SVG，并转换为 TipTap `deck` 节点 JSON。

## 安装

```bash
npm install svg-to-deck-converter @antv/infographic
```

## `convertInfographicToDeck`

按 Gallery 类型 + 模板 + 数据渲染并转换。

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
  // AntV 渲染主题（影响 SDK 出图颜色）
  theme: 'light',
  themeConfig: {
    palette: ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#0891B2', '#16A34A'],
  },
  // 写入 document.attrs.theme；不传则按上面的 theme/palette 自动构建 clrScheme
  deckTheme: {
    clrScheme: {
      name: 'Brand',
      dk1: '#0F172A',
      dk2: '#334155',
      lt1: '#FFFFFF',
      lt2: '#F1F5F9',
      accent1: '#2563EB',
      accent2: '#7C3AED',
      accent3: '#DB2777',
      accent4: '#EA580C',
      accent5: '#0891B2',
      accent6: '#16A34A',
    },
  },
  // 将 fill/stroke 等映射为 accent1… 色槽，默认 true
  mapColorsToThemeSlots: true,
  useGalleryDefaults: true,
  width: 1200,
  height: 800,
  convertOptions: {
    extractText: true,
  },
  offsetTop: 0,
  offsetLeft: 0,
});
```

### 入参

| 字段 | 说明 |
|------|------|
| `category` | Gallery 类型 ID，如 `chart-bar` |
| `template` | 模板示例名（slug），如 `chart-bar-plain-text` |
| `data` | Infographic 图表数据 |
| `theme` | 可选，AntV 主题名（如 `light` / `dark`），影响 SDK 渲染 |
| `themeConfig` | 可选，AntV `ThemeConfig`（如 `palette`、`colorPrimary`） |
| `deckTheme` | 可选，写入 `document.attrs.theme`；不传则根据 AntV theme / palette 自动构建 `clrScheme` |
| `mapColorsToThemeSlots` | 是否将渲染色映射为主题色槽（`accent1`…`dk1` 等），默认 `true`；`false` 时保留原始 hex |
| `useGalleryDefaults` | 默认 `true`，从 Gallery 拉取示例的 theme / design 默认值 |
| `convertOptions` | SVG → deck 转换选项，见下方 |
| `offsetTop` | 所有 `deckNode` 的 `top` 统一偏移（像素），默认 `0`；优先于 `convertOptions.offsetTop` |
| `offsetLeft` | 所有 `deckNode` 的 `left` 统一偏移（像素），默认 `0`；优先于 `convertOptions.offsetLeft` |
| `width` | 目标输出宽度（像素），默认 `960` |
| `height` | 目标输出高度（像素），默认 `640` |

### `convertOptions`

| 字段 | 说明 |
|------|------|
| `extractText` | 是否将 SVG 文本提取为 `multiBlockContainer`，默认 `true` |
| `offsetTop` / `offsetLeft` | deckNode 偏移；若顶层也传了同名字段，以顶层为准 |
| `defaultFontSize` | 默认字号，默认 `14` |
| `defaultFontFamily` | 默认字体，默认 `sans-serif` |

### 返回值

| 字段 | 说明 |
|------|------|
| `svg` | SDK 渲染出的 SVG（`width`/`height` 已写成目标像素） |
| `document` | TipTap deck JSON（含 `attrs.theme.clrScheme`） |
| `stats` | 转换统计 |

`document.attrs.theme.clrScheme` 含 `name`、`dk1`/`dk2`、`lt1`/`lt2`、`accent1`…`accent6`（及可选 `hlink`/`folHlink`）。开启 `mapColorsToThemeSlots` 后，palette 色写入 `accent1`…`accent6`，换主题只需改 `clrScheme` 色值。

## `convertInfographicFromSyntax`

已有完整 Infographic Syntax（与 [Gallery 编辑器](https://infographic.antv.vision/gallery) 相同）时使用。

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
theme light
  palette #2563EB #7C3AED #DB2777
`.trim();

const { svg, document, stats, warnings } = await convertInfographicFromSyntax({
  syntax,
  deckTheme: {
    clrScheme: {
      name: 'Brand',
      dk1: '#0F172A',
      dk2: '#334155',
      lt1: '#FFFFFF',
      lt2: '#F1F5F9',
      accent1: '#2563EB',
      accent2: '#7C3AED',
      accent3: '#DB2777',
      accent4: '#EA580C',
      accent5: '#0891B2',
      accent6: '#16A34A',
    },
  },
  mapColorsToThemeSlots: true,
  width: 1200,
  height: 800,
  convertOptions: {
    extractText: true,
  },
  offsetTop: 0,
  offsetLeft: 0,
});

// 简写：直接传 syntax 字符串（无法指定 width/height，默认 960×640）
// await convertInfographicFromSyntax(syntax, { extractText: true });
```

### 入参

| 字段 | 说明 |
|------|------|
| `syntax` | 完整 Infographic Syntax 字符串 |
| `deckTheme` | 可选，写入 `document.attrs.theme`；不传则根据 Syntax 中的 theme / palette 自动构建 |
| `mapColorsToThemeSlots` | 是否映射主题色槽，默认 `true` |
| `convertOptions` | 同 `convertInfographicToDeck` |
| `offsetTop` / `offsetLeft` | 同 `convertInfographicToDeck` |
| `width` / `height` | 目标尺寸，默认 `960` × `640` |

### 返回值

与 `convertInfographicToDeck` 相同，额外包含 `warnings`（Syntax 解析警告）。

## `validateInfographicInput`

在调用转换 API 前，校验 `data` 或 `syntax` 是否合法。返回 `{ valid, errors, warnings }`；`valid === false` 时 `errors` 含可读错误信息。

```ts
import { validateInfographicInput } from 'svg-to-deck-converter';

// 校验 convertInfographicToDeck 的 data
const dataResult = validateInfographicInput({
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
});
// dataResult.valid === true

// 校验 convertInfographicFromSyntax 的 syntax
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
theme light
  palette #2563EB #7C3AED #DB2777
`.trim();

const syntaxResult = validateInfographicInput({ syntax });
// syntaxResult.valid === true
```

也可直接使用细分方法：`validateInfographicData(data)`、`validateInfographicSyntax(syntax)`、`validateInfographicTemplate(template, category?)`。

校验 `data` 时可附带模板信息（与 `convertInfographicToDeck` 对齐）：

```ts
validateInfographicInput({
  data: sampleData,
  template: 'chart-bar-plain-text',
  category: 'chart-bar', // 可选；传入则校验模板是否属于该类型
});
```

### 返回值

| 字段 | 说明 |
|------|------|
| `valid` | 是否通过校验 |
| `errors` | 错误列表；每项含 `path`、`message`、`code`，Syntax 错误可能含 `line` |
| `warnings` | 警告列表（结构同 `errors`；Syntax 解析警告会映射到此） |

`data` 与 `syntax` 必须二选一传入。`data` 需为对象，且至少包含非空的 `values` / `items` / `lists` / `sequences` / `compares` / `nodes` / `root` / `relations` 之一；`syntax` 需能解析出模板与 `data` 区块，且模板 slug 须存在于 AntV 本地模板列表（`getTemplates()`，无网络请求）。

## Node 字体与文字宽度

Node SSR 量字走 AntV → `measury`（不是读系统 TTF）。下列字体可直接写在 Syntax 里，无需额外注册：

| Syntax `font-family` | 说明 |
|------|------|
| `Alibaba PuHuiTi`（默认） | AntV 内置 |
| `Source Han Sans` / `Source Han Serif` / `LXGW WenKai` / `851tegakizatsu` | AntV 内置 |
| `Microsoft YaHei` / `微软雅黑` | 本包自动识别（CJK 度量与 Alibaba PuHuiTi 同源） |

```ts
await convertInfographicFromSyntax({
  syntax: `... font-family Microsoft YaHei ...`,
});
```

量字只影响 deckNode 宽度；TipTap 端视觉仍依赖客户端有对应字体。

## 本地开发

```bash
npm install
npm run dev          # dev/ 测试页（含主题切换）
npm run build
npm run test         # 单元测试
npm run test:dist    # dist-test/ 基于 dist 的测试页
```

## 构建

```bash
npm run build
```

| 文件 | 用途 |
|------|------|
| `dist/browser/index.js` / `index.cjs` | 浏览器（ESM / CJS） |
| `dist/node/index.js` / `index.cjs` | Node（ESM / CJS） |
| `dist/browser/index.d.ts` | 类型声明 |

