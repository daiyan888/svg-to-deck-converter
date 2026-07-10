# dist-use-use

模拟「再下一层」消费方：分别用 **ESM** 和 **CJS** 调用 `dist-use` 的 `getDeckNodes`。

注意：本目录 `package.json` **没有** `"type": "module"`，用来验证 CJS 场景。

## 准备

```bash
# 1) 根目录先打本库
npm run build

# 2) 构建 dist-use（ESM + CJS）
cd dist-use
npm install
npm run build

# 3) 安装并测试 dist-use-use
cd ../dist-use-use
npm install
npm test
```

或分开跑：

```bash
npm run test:esm   # node run-esm.mjs
npm run test:cjs   # node run-cjs.cjs
```

## 预期

两边都应打印 `ok`，并输出 theme / nodes / commands 等信息。

若 CJS 失败且报 `import.meta`，说明又走到了 ESM 的 `index.node.js`，检查：

1. `dist-use/dist/getDeckNodes.cjs` 是否存在
2. 根目录 `dist/index.node.cjs` 是否存在
3. `dist-use` / 本库 `package.json` 的 `exports.require` 是否指向 `.cjs`
