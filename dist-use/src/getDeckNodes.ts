import {
  convertInfographicFromSyntax,
  type ConvertInfographicResult,
  type DeckDocument,
} from 'svg-to-deck-converter';

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
  const { syntax, width = 960, height = 640, mapColorsToThemeSlots = true } = input;

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
