import { Infographic } from '@antv/infographic';
import { useEffect, useRef, useState } from 'react';
import { ZoomableViewport } from './zoomable-viewport';
import styles from './infographic-sdk-preview.module.css';

const DEFAULT_PREVIEW_WIDTH = 960;
const DEFAULT_PREVIEW_HEIGHT = 640;

interface InfographicSdkPreviewProps {
  syntax: string;
  template?: string;
  /** 与转换目标尺寸一致，避免左右预览画布不一致 */
  width?: number;
  height?: number;
}

function waitForInfographicReady(
  infographic: Infographic,
  timeoutMs = 15000,
): Promise<void> {
  const loaded = new Promise<void>((resolve, reject) => {
    const onLoaded = () => resolve();
    const onError = (error: unknown) => {
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    infographic.on('loaded', onLoaded);
    infographic.on('error', onError);
  });

  const fontsReady = document.fonts?.ready ?? Promise.resolve();

  return Promise.race([
    Promise.all([loaded, fontsReady]).then(() => undefined),
    new Promise<void>((_, reject) => {
      window.setTimeout(() => reject(new Error('SDK 渲染超时')), timeoutMs);
    }),
  ]);
}

export function InfographicSdkPreview({
  syntax,
  template,
  width = DEFAULT_PREVIEW_WIDTH,
  height = DEFAULT_PREVIEW_HEIGHT,
}: InfographicSdkPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewWidth = width > 0 ? width : DEFAULT_PREVIEW_WIDTH;
  const previewHeight = height > 0 ? height : DEFAULT_PREVIEW_HEIGHT;

  useEffect(() => {
    const mount = mountRef.current;
    const trimmed = syntax.trim();
    if (!mount || !trimmed) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    mount.replaceChildren();

    const infographic = new Infographic({
      container: mount,
      width: '100%',
      height: '100%',
    });

    setLoading(true);
    setError(null);
    infographic.render(trimmed);

    void waitForInfographicReady(infographic)
      .then(() => {
        if (!cancelled) {
          setLoading(false);
        }
      })
      .catch((renderError) => {
        if (!cancelled) {
          setLoading(false);
          setError(renderError instanceof Error ? renderError.message : String(renderError));
        }
      });

    return () => {
      cancelled = true;
      infographic.destroy();
      mount.replaceChildren();
    };
  }, [syntax, previewWidth, previewHeight]);

  if (!syntax.trim()) {
    return (
      <div className={styles.empty}>
        选择模板或点击「渲染并转换」后，将在此显示 @antv/infographic SDK 渲染结果
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {template && <p className={styles.meta}>模板：{template}</p>}
      {error && <div className={styles.error}>{error}</div>}
      <ZoomableViewport
        contentWidth={previewWidth}
        contentHeight={previewHeight}
        defaultScale={0.55}
      >
        <div className={styles.stage}>
          <div
            ref={mountRef}
            className={styles.mount}
            style={{ width: previewWidth, height: previewHeight }}
          />
          {loading && <div className={styles.loading}>SDK 渲染中…</div>}
        </div>
      </ZoomableViewport>
    </div>
  );
}
