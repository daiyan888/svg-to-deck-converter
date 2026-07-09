import { parseSyntax, type SyntaxError } from '@antv/infographic';
import { convertSvgToDeck } from '../converter/svg-to-deck.js';
import { finalizeSizedConvertResult } from '../converter/scale-deck.js';
import type { ConvertOptions, ConvertResult } from '../types/deck.js';
import {
  renderInfographicSvg,
  type RenderInfographicSize,
} from './render-gallery-svg.js';

export interface PipelineResult {
  svg: string;
  result: ConvertResult;
  warnings: SyntaxError[];
}

function formatSyntaxErrors(errors: SyntaxError[]): string {
  return errors
    .map((error) => `第 ${error.line} 行 · ${error.path}: ${error.message}`)
    .join('\n');
}

export async function renderAndConvertFromSyntax(
  syntax: string,
  options: ConvertOptions = {},
  size: RenderInfographicSize = {},
): Promise<PipelineResult> {
  const trimmed = syntax.trim();
  if (!trimmed) {
    throw new Error('Syntax 不能为空');
  }

  const parsed = parseSyntax(trimmed);
  if (parsed.errors.length > 0) {
    throw new Error(`Syntax 解析失败:\n${formatSyntaxErrors(parsed.errors)}`);
  }

  const svg = await renderInfographicSvg(trimmed, size);
  // 转换时先不带 offset，由 finalize 在缩放后统一叠加
  const converted = convertSvgToDeck(svg, {
    ...options,
    offsetTop: 0,
    offsetLeft: 0,
  });
  const finalized = finalizeSizedConvertResult(svg, converted, size, options);

  return {
    svg: finalized.svg,
    result: finalized.result,
    warnings: parsed.warnings,
  };
}
