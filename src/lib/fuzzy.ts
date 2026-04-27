const isWordBoundary = (ch: string | undefined): boolean =>
  ch === undefined || /[\s\-_./:]/.test(ch);

/**
 * Returns a non-negative score for how well `query` matches `target`.
 * 0 means no match. Higher = better.
 *
 *   prefix         100
 *   word-start      60
 *   substring       30
 *   fuzzy in order  10
 *   no match         0
 *
 * Tie-break favors shorter targets via a small length bonus.
 */
export const score = (query: string, target: string): number => {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 1;
  if (t.length === 0) return 0;

  const lengthBonus = 1 / (1 + t.length);

  if (t.startsWith(q)) return 100 + lengthBonus;

  // Word-start: any character right after a word boundary.
  for (let i = 1; i < t.length; i += 1) {
    if (isWordBoundary(t[i - 1]) && t.slice(i).startsWith(q)) {
      return 60 + lengthBonus;
    }
  }

  if (t.includes(q)) return 30 + lengthBonus;

  // Fuzzy char-in-order match (every query char appears in `t` in order).
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) qi += 1;
  }
  if (qi === q.length) return 10 + lengthBonus;

  return 0;
};

export interface RankedItem<T> {
  item: T;
  score: number;
}

/**
 * Filters items down to those scoring > 0, then sorts by descending score.
 */
export const rank = <T>(
  items: T[],
  query: string,
  getText: (item: T) => string
): RankedItem<T>[] => {
  const out: RankedItem<T>[] = [];
  for (const item of items) {
    const s = score(query, getText(item));
    if (s > 0) out.push({ item, score: s });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
};
