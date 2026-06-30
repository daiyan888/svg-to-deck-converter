import { useCallback, useEffect, useState } from 'react';
import { ZoomableViewport } from './zoomable-viewport';
import styles from './iframe-preview.module.css';

const DEFAULT_URL = 'https://infographic.antv.vision/gallery/chart-bar-plain-text';
const IFRAME_WIDTH = 960;
const IFRAME_HEIGHT = 640;

interface IframePreviewProps {
  galleryUrl?: string;
}

export function IframePreview({ galleryUrl }: IframePreviewProps) {
  const [urlInput, setUrlInput] = useState(galleryUrl ?? DEFAULT_URL);
  const [iframeSrc, setIframeSrc] = useState(galleryUrl ?? DEFAULT_URL);

  useEffect(() => {
    if (galleryUrl) {
      setUrlInput(galleryUrl);
      setIframeSrc(galleryUrl);
    }
  }, [galleryUrl]);

  const handleLoad = useCallback(() => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      setIframeSrc(trimmed);
    }
  }, [urlInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLoad();
      }
    },
    [handleLoad],
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.urlBar}>
        <input
          className={styles.urlInput}
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入 Gallery 或其他页面 URL"
          spellCheck={false}
        />
        <button type="button" className={styles.loadBtn} onClick={handleLoad}>
          加载
        </button>
      </div>
      <ZoomableViewport
        contentWidth={IFRAME_WIDTH}
        contentHeight={IFRAME_HEIGHT}
        defaultScale={0.55}
      >
        <iframe
          className={styles.iframe}
          src={iframeSrc}
          title="Gallery 预览"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          width={IFRAME_WIDTH}
          height={IFRAME_HEIGHT}
        />
      </ZoomableViewport>
    </div>
  );
}
