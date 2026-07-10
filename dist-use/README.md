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

## 源码入口

`src/getDeckNodes.ts` 通过包名导入：

```ts
import { convertInfographicFromSyntax } from 'svg-to-deck-converter';
```

不要手写 `./dist/index.node.js`。`package.json` 的 `exports.node` 会在 Node 下自动选：

- `import` → `index.node.js`
- `require` → `index.node.cjs`
