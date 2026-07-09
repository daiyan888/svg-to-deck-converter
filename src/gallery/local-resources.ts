import { loadSVGResource, registerResourceLoader } from '@antv/infographic';
import resourceManifest from './resource-manifest.json' with { type: 'json' };

interface ResourceManifest {
  resources?: Record<string, string>;
}

let registered = false;

const ICON_ALIASES: Record<string, string> = {
  'mingcute/receive-line': 'mingcute/receive-money-line',
};

function makeResourceKey(scene: string | undefined, data: string): string {
  const normalizedScene = scene === 'illus' ? 'illus' : 'icon';
  return `${normalizedScene}:${data}`;
}

/**
 * 注册本地 icon / illus 资源加载器，优先从打包进 dist 的 manifest 读取，避免运行时请求 weavefox API。
 */
export function ensureLocalResourcesRegistered(): void {
  if (registered) {
    return;
  }
  registered = true;

  const resources = (resourceManifest as ResourceManifest).resources ?? {};
  if (Object.keys(resources).length === 0) {
    return;
  }

  registerResourceLoader(async (config) => {
    if (config.source !== 'custom' && config.source !== 'search') {
      return null;
    }

    const data = config.data?.trim();
    if (!data) {
      return null;
    }

    const key = makeResourceKey(config.scene, data);
    const alias = config.scene === 'icon' ? ICON_ALIASES[data] : undefined;
    const svg =
      resources[key] ??
      resources[data] ??
      (alias ? resources[makeResourceKey('icon', alias)] : undefined);
    if (!svg) {
      return null;
    }

    return loadSVGResource(svg);
  });
}

export function getLocalResourceCount(): number {
  return Object.keys((resourceManifest as ResourceManifest).resources ?? {}).length;
}
