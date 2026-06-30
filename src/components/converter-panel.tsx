import { useCallback, useMemo, useState } from 'react';
import { convertSvgToDeck } from '../converter/svg-to-deck';
import type { ConvertResult } from '../types/deck';
import { computeDeckSize, DeckEditor } from '../tiptap/deck-editor';
import { getGalleryTemplateUrl } from '../gallery/categories';
import { GalleryPicker } from './gallery-picker';
import { IframePreview } from './iframe-preview';
import { ZoomableViewport } from './zoomable-viewport';
import { SAMPLE_SVG } from '../samples/default-svg';
import styles from './converter-panel.module.css';

export function ConverterPanel() {
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [galleryUrl, setGalleryUrl] = useState(getGalleryTemplateUrl('chart-bar-plain-text'));
  const [selectedTemplate, setSelectedTemplate] = useState('chart-bar-plain-text');

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

  const handleLoadSample = useCallback(() => {
    setSvgInput(SAMPLE_SVG);
    setResult(null);
    setError(null);
    setSelectedTemplate('chart-bar-plain-text');
    setGalleryUrl(getGalleryTemplateUrl('chart-bar-plain-text'));
  }, []);

  const handleGallerySvgLoaded = useCallback(
    (svg: string, selection: { slug: string; galleryUrl: string }) => {
      setSvgInput(svg);
      setResult(null);
      setError(null);
      setSelectedTemplate(selection.slug);
      setGalleryUrl(selection.galleryUrl);
    },
    [],
  );

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>SVG → TipTap Deck 转换器</h1>
        <p className={styles.subtitle}>
          将 AntV Infographic Gallery 等来源的 SVG 转为 deck / deckNode / svg.commands JSON 结构
        </p>
      </header>

      <GalleryPicker
        onSvgLoaded={handleGallerySvgLoaded}
        onGalleryUrlChange={setGalleryUrl}
        onError={setError}
      />

      <div className={styles.toolbar}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={extractText}
            onChange={(e) => setExtractText(e.target.checked)}
          />
          提取 &lt;text&gt; 为 multiBlockContain
        </label>
        <button type="button" className={styles.btn} onClick={handleLoadSample}>
          加载示例
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConvert}>
          转换
        </button>
      </div>

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
            从上方 Gallery 选择器自动提取 SVG，或手动粘贴 SVG 源码。
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

        <section className={`${styles.panel} ${styles.previewPanel}`}>
          <h2 className={styles.panelTitle}>Gallery 页面预览（iframe）</h2>
          <IframePreview galleryUrl={galleryUrl} />
        </section>
      </div>
    </div>
  );
}
