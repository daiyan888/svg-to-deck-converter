import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { measureText } from 'measury';
import { describe, expect, it } from 'vitest';
import { ensureSystemFontMeasureAliases } from './measure-font.js';

const require = createRequire(import.meta.url);
const antvEntry = require.resolve('@antv/infographic');
const antvRoot = join(dirname(antvEntry), '..');

describe('ensureSystemFontMeasureAliases', () => {
  it('Microsoft YaHei / 微软雅黑 measure like built-in Chinese font (no manual register)', () => {
    ensureSystemFontMeasureAliases();

    const yaheiEn = measureText('年度营收增长', {
      fontFamily: 'Microsoft YaHei',
      fontSize: 24,
    });
    const yaheiZh = measureText('年度营收增长', {
      fontFamily: '微软雅黑',
      fontSize: 24,
    });
    const alibaba = measureText('年度营收增长', {
      fontFamily: 'Alibaba PuHuiTi',
      fontSize: 24,
    });
    const missing = measureText('年度营收增长', {
      fontFamily: 'NoSuchFontForSSR',
      fontSize: 24,
    });

    expect(yaheiEn.width).toBeCloseTo(alibaba.width, 5);
    expect(yaheiZh.width).toBeCloseTo(alibaba.width, 5);
    expect(missing.width).toBeLessThan(yaheiEn.width);
  });

  it('AntV measureText picks up auto YaHei aliases', async () => {
    ensureSystemFontMeasureAliases();

    const measureUrl = pathToFileURL(join(antvRoot, 'esm/utils/measure-text.js')).href;
    const { measureText: antvMeasureText } = (await import(measureUrl)) as {
      measureText: (
        text: string,
        attrs: { fontFamily?: string; fontSize?: number },
      ) => { width: number; height: number };
    };

    const viaYahei = antvMeasureText('年度营收增长', {
      fontFamily: 'Microsoft YaHei',
      fontSize: 20,
    });
    const viaAlibaba = antvMeasureText('年度营收增长', {
      fontFamily: 'Alibaba PuHuiTi',
      fontSize: 20,
    });

    expect(viaYahei.width).toBe(viaAlibaba.width);
    expect(viaYahei.width).toBeGreaterThan(80);
  });
});
