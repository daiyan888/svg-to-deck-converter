# dist-use

模拟「二次封装」项目：把 `convertInfographicFromSyntax` 包成 `getDeckNodes`，并用 tsup 打出 **ESM + CJS** 两种格式。

## 准备

先在仓库根目录构建本库：

```bash
npm run build
```

再安装并构建 dist-use：

```bash
cd dist-use
npm install
npm run build
```

产物：

```text
dist/
  getDeckNodes.js      # ESM
  getDeckNodes.cjs     # CJS
  getDeckNodes.d.ts
```

## 为什么 tsconfig 不用 NodeNext

用 **tsup** 打多格式时，源码侧建议：

```json
{
  "module": "ESNext",
  "moduleResolution": "Bundler"
}
```

这样相对导入可以写 `from './defaults'`，**不必**加 `.js`。

如果改成 `moduleResolution: "NodeNext"`，TypeScript 会强制：

```ts
import { x } from './defaults.js'  // 必须带扩展名
```

那是给「`tsc` 直接产出可运行 JS」用的规则；本示例由 tsup 打包，不需要那套约束。

## 源码入口

`src/getDeckNodes.ts` 通过包名导入：

```ts
import { convertInfographicFromSyntax } from 'svg-to-deck-converter';
import { DEFAULT_DECK_SIZE } from './defaults';
```

不要手写 `./dist/index.node.js`。`package.json` 的 `exports.node` 会在 Node 下自动选：

- `import` → `index.node.js`
- `require` → `index.node.cjs`
