import {
  convertInfographicFromSyntax,
  type ConvertInfographicResult,
  type DeckDocument,
} from 'svg-to-deck-converter';
// Bundler 解析：相对路径可不写 .js（若用 NodeNext 则必须写成 './defaults.js'）
import { DEFAULT_DECK_SIZE } from './defaults';

export interface GetDeckNodesInput {
  syntax: string;
  width?: number;
  height?: number;
  mapColorsToThemeSlots?: boolean;
}

export interface GetDeckNodesResult {
  document: DeckDocument;
  svg: string;
  stats: ConvertInfographicResult['stats'];
  warnings: ConvertInfographicResult['warnings'];
}

/**
 * 封装 convertInfographicFromSyntax，供上层项目调用。
 * Node 环境会通过 package exports 解析到 index.node.*。
 */
export async function getDeckNodes(input: GetDeckNodesInput): Promise<GetDeckNodesResult> {
  const {
    syntax,
    width = DEFAULT_DECK_SIZE.width,
    height = DEFAULT_DECK_SIZE.height,
    mapColorsToThemeSlots = true,
  } = input;

  const result = await convertInfographicFromSyntax({
    syntax,
    width,
    height,
    mapColorsToThemeSlots,
  });

  return {
    document: result.document,
    svg: result.svg,
    stats: result.stats,
    warnings: result.warnings,
  };
}

export type { DeckDocument, ConvertInfographicResult };
