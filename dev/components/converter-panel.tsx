import { useCallback, useMemo, useState } from 'react';
import { convertSvgToDeck, fetchGallerySyntax, renderAndConvertFromSyntax } from 'svg-to-deck-converter';
import type { ConvertResult } from 'svg-to-deck-converter';
import { computeDeckSize, DeckEditor } from '../tiptap/deck-editor';
import { GalleryPicker } from './gallery-picker';
import { InfographicSdkPreview } from './infographic-sdk-preview';
import { ZoomableViewport } from './zoomable-viewport';
import { SAMPLE_SVG } from '../samples/default-svg';
import styles from './converter-panel.module.css';

const DEFAULT_TEMPLATE = 'chart-bar-plain-text';

export function ConverterPanel() {
  const [syntaxInput, setSyntaxInput] = useState('');
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [error, setError] = useState<string | null>(null);
  const [syntaxWarnings, setSyntaxWarnings] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [sdkPreviewSyntax, setSdkPreviewSyntax] = useState('');

  const handleConvert = useCallback(() => {
    try {
      setError(null);
      const converted = convertSvgToDeck(svgInput, { extractText });
      setResult(converted);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [svgInput, extractText]);

  const jsonOutput = useMemo(() => {
    if (!result) {
      return '';
    }
    return JSON.stringify(result.document, null, 2);
  }, [result]);

  const handleCopyJson = useCallback(async () => {
    if (!jsonOutput) {
      return;
    }
    await navigator.clipboard.writeText(jsonOutput);
  }, [jsonOutput]);

  const handleLoadSample = useCallback(async () => {
    setError(null);
    setSyntaxWarnings(null);
    setResult(null);
    setSelectedTemplate(DEFAULT_TEMPLATE);

    try {
      const syntax = await fetchGallerySyntax(DEFAULT_TEMPLATE);
      setSyntaxInput(syntax);
      setSdkPreviewSyntax(syntax);
      const converted = convertSvgToDeck(SAMPLE_SVG, { extractText });
      setSvgInput(SAMPLE_SVG);
      setResult(converted);
    } catch (e) {
      setSyntaxInput('');
      setSdkPreviewSyntax('');
      setSvgInput(SAMPLE_SVG);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [extractText]);

  const handleTemplateLoaded = useCallback(
    (payload: { svg: string; syntax: string; selection: { slug: string } }) => {
      setSyntaxInput(payload.syntax);
      setSdkPreviewSyntax(payload.syntax);
      setSvgInput(payload.svg);
      setResult(null);
      setError(null);
      setSyntaxWarnings(null);
      setSelectedTemplate(payload.selection.slug);
    },
    [],
  );

  const handleRenderAndConvert = useCallback(async () => {
    setRendering(true);
    setError(null);
    setSyntaxWarnings(null);

    try {
      const pipeline = await renderAndConvertFromSyntax(syntaxInput, { extractText });
      setSdkPreviewSyntax(syntaxInput);
      setSvgInput(pipeline.svg);
      setResult(pipeline.result);

      if (pipeline.warnings.length > 0) {
        setSyntaxWarnings(
          pipeline.warnings
            .map((warning) => `第 ${warning.line} 行 · ${warning.path}: ${warning.message}`)
            .join('\n'),
        );
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRendering(false);
    }
  }, [extractText, syntaxInput]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>SVG → TipTap Deck 转换器</h1>
        <p className={styles.subtitle}>
          将 AntV Infographic Gallery 等来源的 SVG 转为 deck / deckNode / svg.commands JSON 结构
        </p>
      </header>

      <GalleryPicker onTemplateLoaded={handleTemplateLoaded} onError={setError} />

      <section className={styles.syntaxPanel}>
        <h2 className={styles.panelTitle}>Infographic Syntax（可编辑数据）</h2>
        {selectedTemplate && (
          <p className={styles.hint}>当前模板：{selectedTemplate}</p>
        )}
        <textarea
          className={`${styles.textarea} ${styles.syntaxTextarea}`}
          value={syntaxInput}
          onChange={(e) => setSyntaxInput(e.target.value)}
          spellCheck={false}
          placeholder="从上方 Gallery 选择器加载 syntax，修改 data / theme 等字段后点击下方「渲染并转换」"
        />
        <p className={styles.hint}>
          与 Gallery 官网编辑器相同：修改 <code>data</code> 中的 title、values 等，由 @antv/infographic SDK 重新渲染。
        </p>
      </section>

      <div className={styles.toolbar}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={extractText}
            onChange={(e) => setExtractText(e.target.checked)}
          />
          提取 &lt;text&gt; 为 multiBlockContain
        </label>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => void handleRenderAndConvert()}
          disabled={rendering || !syntaxInput.trim()}
        >
          {rendering ? '渲染并转换中…' : '渲染并转换'}
        </button>
        <button type="button" className={styles.btn} onClick={() => void handleLoadSample()}>
          加载示例
        </button>
        <button type="button" className={styles.btn} onClick={handleConvert}>
          仅转换当前 SVG
        </button>
      </div>

      {syntaxWarnings && <div className={styles.warning}>{syntaxWarnings}</div>}

      <div className={styles.row}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>SVG 输入</h2>
          {selectedTemplate && (
            <p className={styles.hint}>当前示例：{selectedTemplate}</p>
          )}
          <textarea
            className={styles.textarea}
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            spellCheck={false}
            placeholder="粘贴 SVG 源码，或从 Gallery 页面复制 <svg>...</svg>"
          />
          <p className={styles.hint}>
            由 Syntax 渲染生成，也可手动粘贴或编辑 SVG 源码后点「仅转换当前 SVG」。
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>JSON 输出</h2>
            {result && (
              <button type="button" className={styles.btnSmall} onClick={handleCopyJson}>
                复制 JSON
              </button>
            )}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {result && (
            <div className={styles.stats}>
              commands: {result.stats.commandCount} · text: {result.stats.textNodeCount}
              {result.stats.skippedNodes.length > 0 && (
                <span> · 警告: {result.stats.skippedNodes.length}</span>
              )}
            </div>
          )}
          <textarea
            className={styles.textarea}
            value={jsonOutput}
            readOnly
            spellCheck={false}
            placeholder="转换后的 deck JSON 将显示在这里"
          />
        </section>
      </div>

      <div className={styles.row}>
        <section className={`${styles.panel} ${styles.previewPanel}`}>
          <h2 className={styles.panelTitle}>Infographic SDK 渲染预览</h2>
          <InfographicSdkPreview syntax={sdkPreviewSyntax} template={selectedTemplate} />
        </section>

        <section className={`${styles.panel} ${styles.previewPanel}`}>
          <h2 className={styles.panelTitle}>TipTap 渲染预览</h2>
          {result?.document ? (
            <ZoomableViewport
              contentWidth={computeDeckSize(result.document).width}
              contentHeight={computeDeckSize(result.document).height}
              defaultScale={0.55}
            >
              <DeckEditor document={result.document} />
            </ZoomableViewport>
          ) : (
            <DeckEditor document={null} />
          )}
        </section>
      </div>
    </div>
  );
}
