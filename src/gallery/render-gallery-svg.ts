import { Infographic } from '@antv/infographic';

const RENDER_WIDTH = 960;
const RENDER_HEIGHT = 640;

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
      window.setTimeout(() => reject(new Error('渲染 Gallery SVG 超时')), timeoutMs);
    }),
  ]);
}

export async function renderGallerySvgFromSyntax(syntax: string): Promise<string> {
  const mount = document.createElement('div');
  mount.style.cssText = `position:fixed;left:-10000px;top:0;width:${RENDER_WIDTH}px;height:${RENDER_HEIGHT}px;pointer-events:none;opacity:0;`;
  document.body.appendChild(mount);

  const infographic = new Infographic({
    container: mount,
    width: '100%',
    height: '100%',
  });

  try {
    infographic.render(syntax);
    await waitForInfographicReady(infographic);

    const svgEl = mount.querySelector('svg');
    if (!svgEl) {
      throw new Error('未找到渲染后的 SVG 元素');
    }
    // 直接序列化 DOM，保留 <defs> 内 linearGradient 等渐变定义（toDataURL 可能丢失）
    return new XMLSerializer().serializeToString(svgEl);
  } finally {
    infographic.destroy();
    mount.remove();
  }
}

