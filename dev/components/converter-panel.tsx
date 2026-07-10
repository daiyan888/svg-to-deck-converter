import { useCallback, useMemo, useState } from 'react';
import {
  convertInfographicFromSyntax,
  convertSvgToDeck,
  fetchGallerySyntax,
  type ConvertResult,
  type DeckDocument,
  type DeckTheme,
  type ThemeColorSlot,
} from 'svg-to-deck-converter';
import { computeDeckSize, DeckEditor } from '../tiptap/deck-editor';
import { GalleryPicker } from './gallery-picker';
import { InfographicSdkPreview } from './infographic-sdk-preview';
import { ThemeSwitcher } from './theme-switcher';
import { ZoomableViewport } from './zoomable-viewport';
import { SAMPLE_SVG } from '../samples/default-svg';
import { THEME_PRESETS, toThemeConfig, type ThemePreset } from '../theme/presets';
import styles from './converter-panel.module.css';

const DEFAULT_TEMPLATE = 'chart-bar-plain-text';
const DEFAULT_RENDER_WIDTH = 960;
const DEFAULT_RENDER_HEIGHT = 640;

function withClrScheme(document: DeckDocument, clrScheme: DeckTheme): DeckDocument {
  return {
    ...document,
    attrs: {
      ...document.attrs,
      theme: { clrScheme },
    },
  };
}

export function ConverterPanel() {
  const [syntaxInput, setSyntaxInput] = useState('');
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [error, setError] = useState<string | null>(null);
  const [syntaxWarnings, setSyntaxWarnings] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [mapColorsToThemeSlots, setMapColorsToThemeSlots] = useState(true);
  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [renderWidth, setRenderWidth] = useState(DEFAULT_RENDER_WIDTH);
  const [renderHeight, setRenderHeight] = useState(DEFAULT_RENDER_HEIGHT);
  const [rendering, setRendering] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [sdkPreviewSyntax, setSdkPreviewSyntax] = useState('');
  /** 预览覆盖主题；null 表示使用转换结果自带的 clrScheme */
  const [overrideClrScheme, setOverrideClrScheme] = useState<DeckTheme | null>(null);

  const convertOptions = useMemo(
    () => ({ extractText, offsetTop, offsetLeft }),
    [extractText, offsetTop, offsetLeft],
  );

  const renderSize = useMemo(
    () => ({
      width: renderWidth > 0 ? renderWidth : DEFAULT_RENDER_WIDTH,
      height: renderHeight > 0 ? renderHeight : DEFAULT_RENDER_HEIGHT,
    }),
    [renderWidth, renderHeight],
  );

  const previewDocument = useMemo(() => {
    if (!result?.document) {
      return null;
    }
    if (!overrideClrScheme) {
      return result.document;
    }
    return withClrScheme(result.document, overrideClrScheme);
  }, [result, overrideClrScheme]);

  const activeClrScheme = previewDocument?.attrs?.theme?.clrScheme ?? null;

  const applyResult = useCallback((converted: ConvertResult) => {
    setResult(converted);
    setOverrideClrScheme(null);
  }, []);

  const handleConvert = useCallback(() => {
    try {
      setError(null);
      // 用 AntV 预设做 hex→色槽映射；预览换色由 ThemeSwitcher 只改 clrScheme
      const converted = convertSvgToDeck(svgInput, {
        ...convertOptions,
        mapColorsToThemeSlots,
        theme: toThemeConfig(THEME_PRESETS[1].clrScheme),
      });
      applyResult(converted);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [svgInput, convertOptions, mapColorsToThemeSlots, applyResult]);

  const jsonOutput = useMemo(() => {
    if (!previewDocument) {
      return '';
    }
    return JSON.stringify(previewDocument, null, 2);
  }, [previewDocument]);

  const compressedJsonOutput = useMemo(() => {
    if (!previewDocument) {
      return '';
    }
    return JSON.stringify(previewDocument);
  }, [previewDocument]);

  const handleCopyJson = useCallback(async () => {
    if (!jsonOutput) {
      return;
    }
    await navigator.clipboard.writeText(jsonOutput);
  }, [jsonOutput]);

  const handleCopyCompressedJson = useCallback(async () => {
    if (!compressedJsonOutput) {
      return;
    }
    await navigator.clipboard.writeText(compressedJsonOutput);
  }, [compressedJsonOutput]);

  const handleLoadSample = useCallback(async () => {
    setError(null);
    setSyntaxWarnings(null);
    setResult(null);
    setOverrideClrScheme(null);
    setSelectedTemplate(DEFAULT_TEMPLATE);

    try {
      const syntax = await fetchGallerySyntax(DEFAULT_TEMPLATE);
      setSyntaxInput(syntax);
      setSdkPreviewSyntax(syntax);
      const converted = convertSvgToDeck(SAMPLE_SVG, {
        ...convertOptions,
        mapColorsToThemeSlots,
        theme: toThemeConfig(THEME_PRESETS[1].clrScheme),
      });
      setSvgInput(SAMPLE_SVG);
      applyResult(converted);
    } catch (e) {
      setSyntaxInput('');
      setSdkPreviewSyntax('');
      setSvgInput(SAMPLE_SVG);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [convertOptions, mapColorsToThemeSlots, applyResult]);

  const handleTemplateLoaded = useCallback(
    (payload: { svg: string; syntax: string; selection: { slug: string } }) => {
      setSyntaxInput(payload.syntax);
      setSdkPreviewSyntax(payload.syntax);
      setSvgInput(payload.svg);
      setResult(null);
      setOverrideClrScheme(null);
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
      // 不传 deckTheme：按 AntV theme/palette 建 clrScheme 并映射色槽；
      // 之后用 ThemeSwitcher 只改色值，色槽引用不变即可换主题。
      const pipeline = await convertInfographicFromSyntax({
        syntax: syntaxInput,
        convertOptions,
        mapColorsToThemeSlots,
        width: renderSize.width,
        height: renderSize.height,
        offsetTop,
        offsetLeft,
      });
      setSdkPreviewSyntax(syntaxInput);
      setSvgInput(pipeline.svg);
      applyResult({
        document: pipeline.document,
        stats: pipeline.stats,
      });

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
  }, [
    convertOptions,
    mapColorsToThemeSlots,
    offsetLeft,
    offsetTop,
    renderSize,
    syntaxInput,
    applyResult,
  ]);

  const handleSelectPreset = useCallback((preset: ThemePreset) => {
    setOverrideClrScheme(preset.clrScheme);
    setResult((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        document: withClrScheme(prev.document, preset.clrScheme),
      };
    });
  }, []);

  const handleSlotChange = useCallback((slot: ThemeColorSlot, color: string) => {
    setOverrideClrScheme((prev) => {
      const base =
        prev ??
        result?.document.attrs?.theme?.clrScheme ??
        THEME_PRESETS[0].clrScheme;
      const next: DeckTheme = {
        ...base,
        name: base.name.endsWith(' (custom)') ? base.name : `${base.name} (custom)`,
        [slot]: color,
      };
      setResult((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          document: withClrScheme(current.document, next),
        };
      });
      return next;
    });
  }, [result]);

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
          提取 &lt;text&gt; 为 multiBlockContainer
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={mapColorsToThemeSlots}
            onChange={(e) => setMapColorsToThemeSlots(e.target.checked)}
          />
          映射主题色槽
        </label>
        <label className={styles.numberField}>
          offsetTop
          <input
            type="number"
            className={styles.numberInput}
            value={offsetTop}
            onChange={(e) => setOffsetTop(Number(e.target.value) || 0)}
          />
        </label>
        <label className={styles.numberField}>
          offsetLeft
          <input
            type="number"
            className={styles.numberInput}
            value={offsetLeft}
            onChange={(e) => setOffsetLeft(Number(e.target.value) || 0)}
          />
        </label>
        <label className={styles.numberField}>
          width
          <input
            type="number"
            className={styles.numberInput}
            min={1}
            value={renderWidth}
            onChange={(e) => setRenderWidth(Number(e.target.value) || 0)}
          />
        </label>
        <label className={styles.numberField}>
          height
          <input
            type="number"
            className={styles.numberInput}
            min={1}
            value={renderHeight}
            onChange={(e) => setRenderHeight(Number(e.target.value) || 0)}
          />
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

      <ThemeSwitcher
        clrScheme={activeClrScheme}
        onSelectPreset={handleSelectPreset}
        onSlotChange={handleSlotChange}
        disabled={!result}
      />

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
              <div className={styles.panelActions}>
                <button type="button" className={styles.btnSmall} onClick={() => void handleCopyJson()}>
                  复制 JSON
                </button>
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() => void handleCopyCompressedJson()}
                >
                  复制压缩 JSON
                </button>
              </div>
            )}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {result && (
            <div className={styles.stats}>
              commands: {result.stats.commandCount} · text: {result.stats.textNodeCount}
              {result.stats.skippedNodes.length > 0 && (
                <span> · 警告: {result.stats.skippedNodes.length}</span>
              )}
              {mapColorsToThemeSlots && <span> · 色槽映射已开启</span>}
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
          {previewDocument ? (
            <ZoomableViewport
              contentWidth={computeDeckSize(previewDocument).width}
              contentHeight={computeDeckSize(previewDocument).height}
              defaultScale={0.55}
            >
              <DeckEditor
                key={`${previewDocument.attrs.theme.clrScheme.name}-${previewDocument.attrs.theme.clrScheme.accent1}`}
                document={previewDocument}
              />
            </ZoomableViewport>
          ) : (
            <DeckEditor document={null} />
          )}
        </section>
      </div>
    </div>
  );
}
