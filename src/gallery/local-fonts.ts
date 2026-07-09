import fontManifest from './font-manifest.json' with { type: 'json' };

interface FontManifest {
  cssByUrl?: Record<string, string>;
}

const FONT_HOST = 'assets.antv.antgroup.com';
const ICON_HOSTS = ['weavefox.cn', 'lab.weavefox.cn'];

let installed = false;
let originalFetch: typeof fetch | null = null;

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function isFontAssetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === FONT_HOST;
  } catch {
    return url.includes(FONT_HOST);
  }
}

function isIconServiceUrl(url: string): boolean {
  return ICON_HOSTS.some((host) => url.includes(host));
}

function createTextResponse(body: string, status = 200, contentType = 'text/css'): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}

/**
 * 在 Node 环境拦截字体 / icon 远程请求：
 * - 字体 CSS：从本地 font-manifest 返回
 * - 字体 woff2：快速 404（Node 文本测量不依赖这些文件，避免挂起）
 * - weavefox icon API：快速失败，避免本地 miss 后兜底搜索拖垮 SSR
 */
export function ensureLocalFontFetchInstalled(): void {
  if (installed) {
    return;
  }
  if (typeof globalThis.fetch !== 'function') {
    return;
  }

  installed = true;
  originalFetch = globalThis.fetch.bind(globalThis);

  const cssByUrl = (fontManifest as FontManifest).cssByUrl ?? {};

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);

    if (isFontAssetUrl(url)) {
      if (url.endsWith('.css') || url.includes('/result.css')) {
        const css = cssByUrl[url];
        if (css) {
          return createTextResponse(css, 200, 'text/css; charset=utf-8');
        }
        return createTextResponse('/* local font css miss */', 404, 'text/css');
      }

      // woff2 / 其他字体二进制：快速失败，避免远程挂起
      return new Response(null, { status: 404, statusText: 'Local font binary not bundled' });
    }

    if (isIconServiceUrl(url)) {
      return createTextResponse(JSON.stringify({ success: false, data: [] }), 503, 'application/json');
    }

    return originalFetch!(input, init);
  }) as typeof fetch;
}

export function getLocalFontCssCount(): number {
  return Object.keys((fontManifest as FontManifest).cssByUrl ?? {}).length;
}
