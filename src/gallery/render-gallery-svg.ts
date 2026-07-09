import { Infographic, type InfographicOptions } from '@antv/infographic';
import { ensureLocalResourcesRegistered } from './local-resources.js';

const RENDER_WIDTH = 960;
const RENDER_HEIGHT = 640;

export interface RenderInfographicSize {
  width?: number;
  height?: number;
}

function isBrowserEnvironment(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
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
      window.setTimeout(() => reject(new Error('渲染 Infographic SVG 超时')), timeoutMs);
    }),
  ]);
}

async function renderInBrowser(
  options: string | Partial<InfographicOptions>,
  size: RenderInfographicSize,
): Promise<string> {
  const width = size.width ?? RENDER_WIDTH;
  const height = size.height ?? RENDER_HEIGHT;

  const mount = document.createElement('div');
  mount.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;pointer-events:none;opacity:0;`;
  document.body.appendChild(mount);

  const infographic = new Infographic({
    container: mount,
    width: '100%',
    height: '100%',
  });

  try {
    infographic.render(options);
    await waitForInfographicReady(infographic);

    const svgEl = mount.querySelector('svg');
    if (!svgEl) {
      throw new Error('未找到渲染后的 SVG 元素');
    }

    return new XMLSerializer().serializeToString(svgEl);
  } finally {
    infographic.destroy();
    mount.remove();
  }
}

async function renderInNode(
  options: string | Partial<InfographicOptions>,
  size: RenderInfographicSize,
): Promise<string> {
  const { ensureLocalFontFetchInstalled } = await import('svg-to-deck-local-fonts');
  ensureLocalFontFetchInstalled();

  const { renderToString } = await import('@antv/infographic/ssr');
  return renderToString(options as Parameters<typeof renderToString>[0], {
    width: size.width ?? RENDER_WIDTH,
    height: size.height ?? RENDER_HEIGHT,
  });
}

/**
 * 在浏览器或 Node 环境中渲染 Infographic，返回 SVG 字符串。
 * 浏览器走 DOM 渲染；Node 走 @antv/infographic/ssr（避免污染 globalThis.window）。
 */
export async function renderInfographicSvg(
  options: string | Partial<InfographicOptions>,
  size: RenderInfographicSize = {},
): Promise<string> {
  ensureLocalResourcesRegistered();

  if (isBrowserEnvironment()) {
    return renderInBrowser(options, size);
  }

  return renderInNode(options, size);
}

export async function renderGallerySvgFromSyntax(syntax: string): Promise<string> {
  return renderInfographicSvg(syntax);
}
