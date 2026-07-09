import { useCallback, useMemo, useState } from 'react';
import { convertSvgToDeck, renderAndConvertFromSyntax } from '../../dist/index.js';
import type { ConvertResult } from '../../dist/index.js';
import { GalleryPicker } from './gallery-picker';
import type { GalleryTemplatePayload } from './gallery-picker';
import { SAMPLE_SVG } from './sample-svg';

export function App() {
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [syntaxInput, setSyntaxInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractText, setExtractText] = useState(true);
  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(640);

  const convertOptions = useMemo(
    () => ({ extractText, offsetTop, offsetLeft }),
    [extractText, offsetTop, offsetLeft],
  );

  const renderSize = useMemo(() => ({ width, height }), [width, height]);

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

  const handleTemplateLoaded = useCallback((payload: GalleryTemplatePayload) => {
    setSyntaxInput(payload.syntax);
    setSvgInput(payload.svg);
    setRenderedSvg(payload.svg);
    setSelectedTemplate(payload.selection.slug);
    setResult(null);
    setError(null);
  }, []);

  const handleRenderAndConvert = useCallback(async () => {
    if (!syntaxInput.trim()) {
      setError('请先加载或输入 Infographic Syntax');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const pipeline = await renderAndConvertFromSyntax(syntaxInput, convertOptions, renderSize);
      setRenderedSvg(pipeline.svg);
      setSvgInput(pipeline.svg);
      setResult(pipeline.result);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [convertOptions, renderSize, syntaxInput]);

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
          <label className="numberField">
            width
            <input
              type="number"
              className="numberInput"
              min={1}
              value={width}
              onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 960))}
            />
          </label>
          <label className="numberField">
            height
            <input
              type="number"
              className="numberInput"
              min={1}
              value={height}
              onChange={(e) => setHeight(Math.max(1, Number(e.target.value) || 640))}
            />
          </label>
        </div>
      </header>

      <div className="pageTop">
      <GalleryPicker onTemplateLoaded={handleTemplateLoaded} onError={setError} />

      <div className="toolbar">
        <button type="button" onClick={handleConvertSvg}>
          convertSvgToDeck
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

      <div className="apiDocs">
        <section className="apiCard">
          <h3 className="apiName">convertSvgToDeck</h3>
          <p className="apiDesc">将左侧 SVG 字符串转为 TipTap deck JSON（同步，不经过 Infographic SDK 渲染）。</p>
          <dl className="apiList">
            <div>
              <dt>入参</dt>
              <dd>
                <code>svgString: string</code> — 左侧「SVG 输入」文本框内容
              </dd>
              <dd>
                <code>convertOptions?: ConvertOptions</code> — 页头选项：
                <code>extractText</code>、<code>offsetTop</code>、<code>offsetLeft</code>
                （另有 <code>defaultFontSize</code>、<code>defaultFontFamily</code> 默认值）
              </dd>
            </div>
            <div>
              <dt>返回</dt>
              <dd>
                <code>ConvertResult</code>
                <ul>
                  <li><code>document</code> — deck JSON（显示在「deck JSON 输出」）</li>
                  <li><code>stats.commandCount</code> — SVG 绘图命令数</li>
                  <li><code>stats.textNodeCount</code> — 提取的文本节点数</li>
                  <li><code>stats.skippedNodes</code> — 跳过的 SVG 节点 id 列表</li>
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <section className="apiCard">
          <h3 className="apiName">renderAndConvertFromSyntax</h3>
          <p className="apiDesc">
            解析 Infographic Syntax → @antv/infographic SDK 渲染 SVG → 再调用 convertSvgToDeck（异步流水线）。
          </p>
          <dl className="apiList">
            <div>
              <dt>入参</dt>
              <dd>
                <code>syntax: string</code> — 右侧「Infographic Syntax」文本框内容
              </dd>
              <dd>
                <code>convertOptions?: ConvertOptions</code> — 同上
              </dd>
              <dd>
                <code>size?: {'{'} width?, height? {'}'}</code> — 页头
                <code>width</code> / <code>height</code>（默认 960 × 640）
              </dd>
            </div>
            <div>
              <dt>返回</dt>
              <dd>
                <code>Promise&lt;PipelineResult&gt;</code>
                <ul>
                  <li><code>svg</code> — SDK 渲染出的 SVG（更新左侧输入与「SVG 预览」）</li>
                  <li><code>result</code> — 同上 <code>ConvertResult</code></li>
                  <li><code>warnings</code> — Syntax 解析警告（非致命，无问题时为空数组）</li>
                </ul>
              </dd>
            </div>
          </dl>
        </section>
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
      </div>

      <div className="workArea">
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
          <h2>
            Infographic Syntax
            {selectedTemplate && <span className="panelHint"> · {selectedTemplate}</span>}
          </h2>
          <textarea
            value={syntaxInput}
            onChange={(e) => setSyntaxInput(e.target.value)}
            spellCheck={false}
            placeholder="从上方 Gallery 选择器加载，或手动粘贴 syntax"
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
    </div>
  );
}
