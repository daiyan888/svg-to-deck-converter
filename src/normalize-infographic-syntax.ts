const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/**
 * Decode a single HTML entity body (without surrounding `&` / `;`).
 * Unknown named entities are left unchanged.
 */
function decodeHtmlEntityBody(entity: string): string | null {
  if (entity[0] === '#') {
    const code =
      entity[1] === 'x' || entity[1] === 'X'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
    if (!Number.isFinite(code)) return null;
    try {
      return String.fromCodePoint(code);
    } catch {
      return null;
    }
  }
  return NAMED_HTML_ENTITIES[entity] ?? null;
}

/**
 * Decode common HTML entities that appear when Syntax is copied from Gallery HTML
 * (e.g. `-&gt;` / `&lt;-` instead of `->` / `<-` in relation lines).
 */
export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    return decodeHtmlEntityBody(entity) ?? match;
  });
}

/**
 * Normalize Infographic Syntax before `parseSyntax` / render.
 * Trims whitespace and decodes HTML entities from copy-paste / HTML extraction.
 */
export function normalizeInfographicSyntax(syntax: string): string {
  return decodeHtmlEntities(syntax.trim());
}
