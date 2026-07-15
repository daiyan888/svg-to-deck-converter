import { describe, expect, it } from 'vitest';
import {
  decodeHtmlEntities,
  normalizeInfographicSyntax,
} from './normalize-infographic-syntax.js';
import { validateInfographicSyntax } from './validate-infographic-input.js';

describe('decodeHtmlEntities', () => {
  it('decodes relation arrow entities from HTML copy-paste', () => {
    expect(decodeHtmlEntities('a -&gt; b')).toBe('a -> b');
    expect(decodeHtmlEntities('a &lt;- b')).toBe('a <- b');
    expect(decodeHtmlEntities('a &lt;- label -&gt; b')).toBe('a <- label -> b');
  });

  it('decodes numeric and named entities', () => {
    expect(decodeHtmlEntities('A&amp;B')).toBe('A&B');
    expect(decodeHtmlEntities('&#62;')).toBe('>');
    expect(decodeHtmlEntities('&#x3c;')).toBe('<');
  });

  it('leaves unknown named entities unchanged', () => {
    expect(decodeHtmlEntities('&unknown;')).toBe('&unknown;');
  });
});

describe('normalizeInfographicSyntax', () => {
  it('trims and decodes', () => {
    expect(normalizeInfographicSyntax('  a -&gt; b  \n')).toBe('a -> b');
  });

  it('makes HTML-escaped sequence relations parseable', () => {
    const syntax = `
infographic sequence-interaction-compact-animated-badge-card
data
  title TCP三次握手
  sequences
    - label 客户端
      children
        - label CLOSED
          id client-closed
        - label ESTABLISHED
          id client-established
    - label 服务器
      children
        - label LISTEN
          id server-listen
        - label ESTABLISHED
          id server-established
  relations
    client-closed - SYN=1, seq=x -&gt; server-listen
    client-established &lt;- 数据传输 -&gt; server-established
theme light
  palette antv
`.trim();

    const result = validateInfographicSyntax(syntax);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
