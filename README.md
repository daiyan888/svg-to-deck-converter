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
  convertOptions: {
    extractText: true,
  },
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
| `convertOptions` | SVG → deck 转换选项 |

### 返回值

| 字段 | 说明 |
|------|------|
| `svg` | SDK 渲染出的 SVG 字符串 |
| `document` | TipTap deck JSON |
| `stats` | 转换统计（commands 数、text 节点数等） |

## 其他 API

```ts
// 从完整 Syntax 字符串转换（与 Gallery 编辑器语法相同）
import { convertInfographicFromSyntax } from 'svg-to-deck-converter';

// 仅转换已有 SVG
import { convertSvgToDeck } from 'svg-to-deck-converter';

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
    └── multiBlockContain
        └── paragraph → text + textStyle
```
