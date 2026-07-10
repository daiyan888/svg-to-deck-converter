import { useCallback, useMemo, useState } from 'react';
import {
  convertInfographicFromSyntax,
  convertSvgToDeck,
  type ConvertResult,
  type DeckDocument,
  type DeckTheme,
  type ThemeColorSlot,
} from '../../dist/browser/index.js';
import { DeckPreview } from './deck-preview';
import { GalleryPicker } from './gallery-picker';
import type { GalleryTemplatePayload } from './gallery-picker';
import { SAMPLE_SVG } from './sample-svg';
import { THEME_PRESETS, toThemeConfig, type ThemePreset } from './theme-presets';
import { ThemeSwitcher } from './theme-switcher';
import { TextStyleSwitcher } from './text-style-switcher';
import {
  sampleTextStyle,
  withTextStyleOverrides,
  type TextStyleOverride,
} from './apply-text-style';

function withClrScheme(document: DeckDocument, clrScheme: DeckTheme): DeckDocument {
  return {
    ...document,
    attrs: {
      ...document.attrs,
      theme: { clrScheme },
    },
  };
}

export function App() {
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [syntaxInput, setSyntaxInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [renderedSvg, setRenderedSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractText, setExtractText] = useState(true);
  const [mapColorsToThemeSlots, setMapColorsToThemeSlots] = useState(true);
  const [offsetTop, setOffsetTop] = useState(0);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(640);
  /** 悬停预览主题；仅驱动 CSS，不写入 document */
  const [hoverPreviewClrScheme, setHoverPreviewClrScheme] = useState<DeckTheme | null>(null);
  /** 悬停预览字号 / 颜色；仅驱动渲染，不写入 marks */
  const [hoverPreviewTextStyle, setHoverPreviewTextStyle] = useState<TextStyleOverride | null>(
    null,
  );

  const convertOptions = useMemo(
    () => ({ extractText, offsetTop, offsetLeft }),
    [extractText, offsetTop, offsetLeft],
  );

  const renderSize = useMemo(() => ({ width, height }), [width, height]);

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

  const jsonOutput = useMemo(() => {
    if (!committedDocument) {
      return '';
    }
    return JSON.stringify(committedDocument, null, 2);
  }, [committedDocument]);

  const handleConvertSvg = useCallback(() => {
    try {
      setError(null);
      setRenderedSvg(svgInput);
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
  }, [applyResult, convertOptions, mapColorsToThemeSlots, svgInput]);

  const handleTemplateLoaded = useCallback((payload: GalleryTemplatePayload) => {
    setSyntaxInput(payload.syntax);
    setSvgInput(payload.svg);
    setRenderedSvg(payload.svg);
    setSelectedTemplate(payload.selection.slug);
    setResult(null);
    setHoverPreviewClrScheme(null);
    setHoverPreviewTextStyle(null);
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
      const pipeline = await convertInfographicFromSyntax({
        syntax: syntaxInput,
        convertOptions,
        mapColorsToThemeSlots,
        width: renderSize.width,
        height: renderSize.height,
        offsetTop,
        offsetLeft,
      });
      setRenderedSvg(pipeline.svg);
      setSvgInput(pipeline.svg);
      applyResult({
        document: pipeline.document,
        stats: pipeline.stats,
      });
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    applyResult,
    convertOptions,
    mapColorsToThemeSlots,
    offsetLeft,
    offsetTop,
    renderSize,
    syntaxInput,
  ]);

  const handleCopyJson = useCallback(async () => {
    if (!jsonOutput) {
      return;
    }
    await navigator.clipboard.writeText(jsonOutput);
  }, [jsonOutput]);

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
      const base = committedClrScheme ?? THEME_PRESETS[0].clrScheme;
      setHoverPreviewClrScheme({
        ...base,
        name: base.name.endsWith(' (custom)') ? base.name : `${base.name} (custom)`,
        [slot]: color,
      });
    },
    [committedClrScheme],
  );

  const handleSlotChange = useCallback((slot: ThemeColorSlot, color: string) => {
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
  }, []);

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
    <div className="page">
      <header className="header">
        <div>
          <h1>dist 独立测试页</h1>
          <p>
            通过 <code>import ... from &apos;../../dist/browser/index.js&apos;</code> 直接引用打包后的
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={mapColorsToThemeSlots}
              onChange={(e) => setMapColorsToThemeSlots(e.target.checked)}
            />
            映射主题色槽
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
            convertInfographicFromSyntax
          </button>
          {result && (
            <button type="button" className="secondary" onClick={() => void handleCopyJson()}>
              复制 JSON
            </button>
          )}
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

        <div className="apiDocs">
          <section className="apiCard">
            <h3 className="apiName">convertSvgToDeck</h3>
            <p className="apiDesc">
              将左侧 SVG 字符串转为 TipTap deck JSON（同步）。开启「映射主题色槽」时用 AntV 预设做 hex→色槽。
            </p>
            <dl className="apiList">
              <div>
                <dt>入参</dt>
                <dd>
                  <code>svgString: string</code> — 左侧「SVG 输入」文本框内容
                </dd>
                <dd>
                  <code>convertOptions?: ConvertOptions</code> — 含
                  <code>extractText</code>、<code>offsetTop</code>、<code>offsetLeft</code>、
                  <code>mapColorsToThemeSlots</code>、<code>theme</code>
                </dd>
              </div>
              <div>
                <dt>返回</dt>
                <dd>
                  <code>ConvertResult</code>
                  <ul>
                    <li>
                      <code>document</code> — deck JSON（含 <code>attrs.theme.clrScheme</code>）
                    </li>
                    <li>
                      <code>stats</code> — command / text / skipped 统计
                    </li>
                  </ul>
                </dd>
              </div>
            </dl>
          </section>

          <section className="apiCard">
            <h3 className="apiName">convertInfographicFromSyntax</h3>
            <p className="apiDesc">
              解析 Syntax → SDK 渲染 SVG → 转换 deck；默认按 AntV palette 构建 clrScheme 并映射色槽。
            </p>
            <dl className="apiList">
              <div>
                <dt>入参</dt>
                <dd>
                  <code>syntax</code> / <code>convertOptions</code> / <code>mapColorsToThemeSlots</code>
                </dd>
                <dd>
                  <code>width</code> / <code>height</code> — 页头尺寸
                </dd>
              </div>
              <div>
                <dt>返回</dt>
                <dd>
                  <code>Promise&lt;ConvertInfographicResult&gt;</code>
                  <ul>
                    <li>
                      <code>svg</code> — SDK 渲染 SVG
                    </li>
                    <li>
                      <code>document</code> — deck JSON
                    </li>
                    <li>
                      <code>warnings</code> — Syntax 警告
                    </li>
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
            {mapColorsToThemeSlots && <span> · 色槽映射已开启</span>}
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
            <h2>SVG 预览（原始渲染）</h2>
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

        <section className="panel deckPreviewPanel">
          <h2>
            Deck 主题预览
            {committedClrScheme && (
              <span className="panelHint"> · {committedClrScheme.name}</span>
            )}
          </h2>
          <div className="previewBox deckPreviewBox">
            {committedDocument ? (
              <DeckPreview
                document={committedDocument}
                previewClrScheme={hoverPreviewClrScheme}
                previewTextStyle={hoverPreviewTextStyle}
              />
            ) : (
              <span className="placeholder">转换后可切换主题色查看色槽渲染</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
