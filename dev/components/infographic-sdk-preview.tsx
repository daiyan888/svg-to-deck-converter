import { Infographic } from '@antv/infographic';
import { useEffect, useRef, useState } from 'react';
import { ZoomableViewport } from './zoomable-viewport';
import styles from './infographic-sdk-preview.module.css';

const PREVIEW_WIDTH = 960;
const PREVIEW_HEIGHT = 640;

interface InfographicSdkPreviewProps {
  syntax: string;
  template?: string;
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

export function InfographicSdkPreview({ syntax, template }: InfographicSdkPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [syntax]);

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
        contentWidth={PREVIEW_WIDTH}
        contentHeight={PREVIEW_HEIGHT}
        defaultScale={0.55}
      >
        <div className={styles.stage}>
          <div
            ref={mountRef}
            className={styles.mount}
            style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
          />
          {loading && <div className={styles.loading}>SDK 渲染中…</div>}
        </div>
      </ZoomableViewport>
    </div>
  );
}
