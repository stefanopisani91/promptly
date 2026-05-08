// Mini-tokeniser per il markup `[[term:<id>]]testo visibile[[/term]]`
// usato nei paragrafi delle lezioni V3 per segnalare i termini cliccabili
// del Glossario Vivo.
//
// Esempio:
//   "Una [[term:prompt]]prompt[[/term]] è la frase che dai all'AI."
//   →
//   ["Una ", { kind: "term", id: "prompt", text: "prompt" }, " è la frase che dai all'AI."]
//
// Pure function, zero dipendenze runtime: il chiamante (TextStep,
// PrincipleStep) mappa i nodi a React elements. Tenuto fuori dalla
// directory components/ perché serve anche al validator JSON e alla
// migrazione futura del contenuto.

export type GlossaryNode =
  | { kind: "text"; text: string }
  | { kind: "term"; id: string; text: string };

const TOKEN_RE = /\[\[term:([a-z][a-z0-9-]*)\]\]([\s\S]+?)\[\[\/term\]\]/g;

/**
 * Parse a paragraph string into a list of plain-text and term nodes.
 *
 * Edge cases:
 *   - Strings without any `[[term:` markup return a single text node.
 *   - Malformed markup (unclosed `[[term:`) is preserved verbatim — the
 *     regex requires a matching closing tag, so unclosed openings just
 *     fall through into the text segment.
 *   - Empty input returns an empty array (caller can guard with .length).
 */
export function parseGlossaryMarkup(input: string): GlossaryNode[] {
  if (!input) return [];
  const nodes: GlossaryNode[] = [];
  let lastIndex = 0;
  // Reset regex state explicitly — TOKEN_RE is module-scoped and reused
  // across calls, so a previous invocation could leave .lastIndex stale.
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(input)) !== null) {
    const [full, id, text] = match;
    const start = match.index;
    if (start > lastIndex) {
      nodes.push({ kind: "text", text: input.slice(lastIndex, start) });
    }
    nodes.push({ kind: "term", id, text });
    lastIndex = start + full.length;
  }
  if (lastIndex < input.length) {
    nodes.push({ kind: "text", text: input.slice(lastIndex) });
  }
  return nodes;
}

/**
 * True when the string contains at least one well-formed term marker.
 * Cheap pre-check the renderer can use to skip parsing on the 95% of
 * paragraphs that have no markup.
 */
export function hasGlossaryMarkup(input: string): boolean {
  if (!input) return false;
  TOKEN_RE.lastIndex = 0;
  return TOKEN_RE.test(input);
}
