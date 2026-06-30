import { useCallback, useState, type ReactNode } from 'react';
import styles from './zoomable-viewport.module.css';

interface ZoomableViewportProps {
  children: ReactNode;
  /** 内容原始宽度，用于计算缩放后占位 */
  contentWidth?: number;
  /** 内容原始高度 */
  contentHeight?: number;
  defaultScale?: number;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

export function ZoomableViewport({
  children,
  contentWidth = 800,
  contentHeight = 500,
  defaultScale = 0.55,
  minScale = 0.2,
  maxScale = 1.5,
  className,
}: ZoomableViewportProps) {
  const [scale, setScale] = useState(defaultScale);

  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number(e.target.value));
  }, []);

  const scaledW = contentWidth * scale;
  const scaledH = contentHeight * scale;

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <div className={styles.controls}>
        <label className={styles.label}>
          缩放
          <input
            type="range"
            className={styles.slider}
            min={minScale}
            max={maxScale}
            step={0.05}
            value={scale}
            onChange={handleScaleChange}
          />
          <span className={styles.value}>{Math.round(scale * 100)}%</span>
        </label>
      </div>
      <div className={styles.scroll}>
        <div className={styles.sizer} style={{ width: scaledW, height: scaledH }}>
          <div
            className={styles.content}
            style={{
              width: contentWidth,
              height: contentHeight,
              transform: `scale(${scale})`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
