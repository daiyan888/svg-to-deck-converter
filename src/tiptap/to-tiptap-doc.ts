import type { DeckDocument } from '../types/deck';

/** TipTap 根节点是 doc，deck 作为其子节点 */
export function toTiptapDoc(document: DeckDocument) {
  return {
    type: 'doc' as const,
    content: [document],
  };
}
