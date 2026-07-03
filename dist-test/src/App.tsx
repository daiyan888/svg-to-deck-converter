import { useCallback, useMemo, useState } from 'react';
import {
  convertSvgToDeck,
  fetchGallerySyntax,
  renderAndConvertFromSyntax,
} from '../../dist/index.js';
import type { ConvertResult } from '../../dist/index.js';
import { SAMPLE_SVG } from './sample-svg';

const DEFAULT_TEMPLATE = 'chart-bar-plain-text';

export function App() {
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [syntaxInput, setSyntaxInput] = useState('');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractText, setExtractText] = useState(true);
  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const convertOptions = useMemo(
    () => ({ extractText, offsetTop, offsetLeft }),
    [extractText, offsetTop, offsetLeft],
  );

  const jsonOutput = useMemo(() => {
    if (!result) {
      return '';
    }
    return JSON.stringify(result.document, null, 2);
  }, [result]);

  const handleConvertSvg = useCallback(() => {
    try {
      setError(null);
      setRenderedSvg(svgInput);
      const converted = convertSvgToDeck(svgInput, convertOptions);
      setResult(converted);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [convertOptions, svgInput]);

  const handleLoadGallerySyntax = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const syntax = await fetchGallerySyntax(DEFAULT_TEMPLATE);
      setSyntaxInput(syntax);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRenderAndConvert = useCallback(async () => {
    if (!syntaxInput.trim()) {
      setError('请先加载或输入 Infographic Syntax');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const pipeline = await renderAndConvertFromSyntax(syntaxInput, convertOptions);
      setRenderedSvg(pipeline.svg);
      setSvgInput(pipeline.svg);
      setResult(pipeline.result);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [convertOptions, syntaxInput]);

  const handleCopyJson = useCallback(async () => {
    if (!jsonOutput) {
      return;
    }
    await navigator.clipboard.writeText(jsonOutput);
  }, [jsonOutput]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>dist 独立测试页</h1>
          <p>
            通过 <code>import ... from &apos;../../dist/index.js&apos;</code> 直接引用打包后的
            <code>dist/</code>（已内联 @antv/infographic，零额外运行时依赖）
          </p>
        </div>
        <div className="headerControls">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={extractText}
              onChange={(e) => setExtractText(e.target.checked)}
            />
            提取 text 为 multiBlockContainer
          </label>
          <label className="numberField">
            offsetTop
            <input
              type="number"
              className="numberInput"
              value={offsetTop}
              onChange={(e) => setOffsetTop(Number(e.target.value) || 0)}
            />
          </label>
          <label className="numberField">
            offsetLeft
            <input
              type="number"
              className="numberInput"
              value={offsetLeft}
              onChange={(e) => setOffsetLeft(Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </header>

      <div className="toolbar">
        <button type="button" onClick={handleConvertSvg}>
          convertSvgToDeck
        </button>
        <button type="button" onClick={() => void handleLoadGallerySyntax()} disabled={loading}>
          fetchGallerySyntax
        </button>
        <button type="button" onClick={() => void handleRenderAndConvert()} disabled={loading}>
          renderAndConvertFromSyntax
        </button>
        {result && (
          <button type="button" className="secondary" onClick={() => void handleCopyJson()}>
            复制 JSON
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="stats">
          commands: {result.stats.commandCount} · text nodes: {result.stats.textNodeCount}
          {result.stats.skippedNodes.length > 0 && (
            <span> · skipped: {result.stats.skippedNodes.length}</span>
          )}
        </div>
      )}

      <div className="grid">
        <section className="panel">
          <h2>SVG 输入</h2>
          <textarea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            spellCheck={false}
          />
        </section>

        <section className="panel">
          <h2>Infographic Syntax</h2>
          <textarea
            value={syntaxInput}
            onChange={(e) => setSyntaxInput(e.target.value)}
            spellCheck={false}
            placeholder="点击 fetchGallerySyntax 加载，或手动粘贴 syntax"
          />
        </section>
      </div>

      <div className="grid">
        <section className="panel preview">
          <h2>SVG 预览</h2>
          <div className="previewBox">
            {renderedSvg ? (
              <div className="svgMount" dangerouslySetInnerHTML={{ __html: renderedSvg }} />
            ) : (
              <span className="placeholder">转换后显示 SVG</span>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>deck JSON 输出</h2>
          <textarea value={jsonOutput} readOnly spellCheck={false} placeholder="转换结果" />
        </section>
      </div>
    </div>
  );
}
