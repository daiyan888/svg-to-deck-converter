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
import { TextStyleSwitcher } from './text-style-switcher';
import { ZoomableViewport } from './zoomable-viewport';
import { SAMPLE_SVG } from '../samples/default-svg';
import {
  sampleTextStyle,
  withTextStyleOverrides,
  type TextStyleOverride,
} from '../text-style/apply-text-style';
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
  /** 悬停预览主题；仅驱动 CSS，不写入 document */
  const [hoverPreviewClrScheme, setHoverPreviewClrScheme] = useState<DeckTheme | null>(null);
  /** 悬停预览字号 / 颜色；仅驱动 CSS，不写入 marks */
  const [hoverPreviewTextStyle, setHoverPreviewTextStyle] = useState<TextStyleOverride | null>(
    null,
  );

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

  const committedDocument = result?.document ?? null;
  const committedClrScheme = committedDocument?.attrs?.theme?.clrScheme ?? null;
  const committedTextStyle = useMemo(
    () => sampleTextStyle(committedDocument),
    [committedDocument],
  );
  const textSwatchColors = useMemo(() => {
    if (!committedClrScheme) {
      return [];
    }
    return [
      committedClrScheme.dk1,
      committedClrScheme.dk2,
      committedClrScheme.accent1,
      committedClrScheme.accent2,
      committedClrScheme.accent3,
    ].filter(Boolean);
  }, [committedClrScheme]);

  const applyResult = useCallback((converted: ConvertResult) => {
    setResult(converted);
    setHoverPreviewClrScheme(null);
    setHoverPreviewTextStyle(null);
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
    if (!committedDocument) {
      return '';
    }
    return JSON.stringify(committedDocument, null, 2);
  }, [committedDocument]);

  const compressedJsonOutput = useMemo(() => {
    if (!committedDocument) {
      return '';
    }
    return JSON.stringify(committedDocument);
  }, [committedDocument]);

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
    setHoverPreviewClrScheme(null);
    setHoverPreviewTextStyle(null);
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
      setHoverPreviewClrScheme(null);
      setHoverPreviewTextStyle(null);
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
    setHoverPreviewClrScheme(null);
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

  const handlePreviewPreset = useCallback((preset: ThemePreset) => {
    setHoverPreviewClrScheme(preset.clrScheme);
  }, []);

  const handlePreviewEnd = useCallback(() => {
    setHoverPreviewClrScheme(null);
  }, []);

  const handleSlotPreview = useCallback(
    (slot: ThemeColorSlot, color: string) => {
      const base =
        committedClrScheme ?? THEME_PRESETS[0].clrScheme;
      setHoverPreviewClrScheme({
        ...base,
        name: base.name.endsWith(' (custom)') ? base.name : `${base.name} (custom)`,
        [slot]: color,
      });
    },
    [committedClrScheme],
  );

  const handleSlotChange = useCallback(
    (slot: ThemeColorSlot, color: string) => {
      setHoverPreviewClrScheme(null);
      setResult((current) => {
        if (!current) {
          return current;
        }
        const base =
          current.document.attrs?.theme?.clrScheme ?? THEME_PRESETS[0].clrScheme;
        const next: DeckTheme = {
          ...base,
          name: base.name.endsWith(' (custom)') ? base.name : `${base.name} (custom)`,
          [slot]: color,
        };
        return {
          ...current,
          document: withClrScheme(current.document, next),
        };
      });
    },
    [],
  );

  const handlePreviewFontSize = useCallback((fontSize: string) => {
    setHoverPreviewTextStyle({ fontSize });
  }, []);

  const handleSelectFontSize = useCallback((fontSize: string) => {
    setHoverPreviewTextStyle(null);
    setResult((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        document: withTextStyleOverrides(current.document, { fontSize }),
      };
    });
  }, []);

  const handlePreviewTextColor = useCallback((color: string) => {
    setHoverPreviewTextStyle({ color });
  }, []);

  const handleSelectTextColor = useCallback((color: string) => {
    setHoverPreviewTextStyle(null);
    setResult((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        document: withTextStyleOverrides(current.document, { color }),
      };
    });
  }, []);

  const handleTextStylePreviewEnd = useCallback(() => {
    setHoverPreviewTextStyle(null);
  }, []);

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
        clrScheme={committedClrScheme}
        onSelectPreset={handleSelectPreset}
        onPreviewPreset={handlePreviewPreset}
        onPreviewEnd={handlePreviewEnd}
        onSlotChange={handleSlotChange}
        onSlotPreview={handleSlotPreview}
        disabled={!result}
      />

      <TextStyleSwitcher
        fontSize={committedTextStyle.fontSize}
        color={committedTextStyle.color}
        swatchColors={textSwatchColors}
        onPreviewFontSize={handlePreviewFontSize}
        onSelectFontSize={handleSelectFontSize}
        onPreviewColor={handlePreviewTextColor}
        onSelectColor={handleSelectTextColor}
        onPreviewEnd={handleTextStylePreviewEnd}
        disabled={!result || !committedTextStyle.hasText}
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
          <InfographicSdkPreview
            syntax={sdkPreviewSyntax}
            template={selectedTemplate}
            width={renderSize.width}
            height={renderSize.height}
          />
        </section>

        <section className={`${styles.panel} ${styles.previewPanel}`}>
          <h2 className={styles.panelTitle}>TipTap 渲染预览</h2>
          {committedDocument ? (
            <ZoomableViewport
              contentWidth={computeDeckSize(committedDocument).width}
              contentHeight={computeDeckSize(committedDocument).height}
              defaultScale={0.55}
            >
              <DeckEditor
                document={committedDocument}
                previewClrScheme={hoverPreviewClrScheme}
                previewTextStyle={hoverPreviewTextStyle}
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
