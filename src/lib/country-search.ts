/**
 * MIRRORED FROM evera-one/src/lib/country-search.ts — keep the two in step.
 *
 * The two repos share no package, so this is a deliberate copy rather than an
 * import. It is ~60 lines of pure function with tests on the Evera One side;
 * adding a shared package for it would cost more than the duplication does.
 *
 * Ranking for the country picker.
 *
 * cmdk's default filter is a subsequence fuzzy match, which on a 243-item list
 * is actively wrong: typing "Pol" scored "Saint Pierre and Miquelon", "Palau"
 * and "Bolivia" above Poland, which fell below the fold. On a closed, known set
 * like countries, people type a prefix and expect the prefix. So we score
 * explicitly, prefix first, and never fall back to subsequence matching.
 */

/** Lowercase and strip diacritics, so "aland" finds "Åland Islands". */
export function foldForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** True when any whitespace-separated word of `text` starts with `query`. */
function hasWordStartingWith(text: string, query: string): boolean {
  return text.split(/[\s(),.'-]+/).some((word) => word.startsWith(query));
}

/**
 * Higher is a better match; 0 hides the row. The bands are deliberately far
 * apart so a name hit always outranks an alias or dial-code hit.
 *
 * @param name     the country's display name
 * @param query    what the user typed
 * @param keywords dial code, ISO alpha-2 and alternate spellings
 */
export function scoreCountryMatch(
  name: string,
  query: string,
  keywords: string[] = [],
): number {
  const q = foldForSearch(query);
  if (!q) return 1; // empty search shows everything, in list order

  const folded = foldForSearch(name);
  if (folded === q) return 100;
  if (folded.startsWith(q)) return 90;
  if (hasWordStartingWith(folded, q)) return 80;

  // Dial code: "971" and "+971" both find the Emirates. Digits only, so a
  // query like "1" doesn't sweep in every name containing the letter.
  const digits = q.replace(/^\+/, "");
  if (/^[0-9]+$/.test(digits)) {
    for (const keyword of keywords) {
      if (!keyword.startsWith("+")) continue;
      const code = keyword.slice(1);
      if (code === digits) return 70;
      if (code.startsWith(digits)) return 60;
    }
  }

  // ISO alpha-2, exact only — "ae" should find the Emirates, but a 2-letter
  // query shouldn't drag in every country whose code happens to contain it.
  if (q.length === 2) {
    for (const keyword of keywords) {
      if (keyword.length === 2 && foldForSearch(keyword) === q) return 65;
    }
  }

  const aliases = keywords.filter((k) => !k.startsWith("+") && k.length !== 2);
  for (const alias of aliases) {
    const foldedAlias = foldForSearch(alias);
    if (foldedAlias === q) return 55;
    if (foldedAlias.startsWith(q)) return 50;
    if (hasWordStartingWith(foldedAlias, q)) return 40;
  }

  // Last resort: the query appears somewhere inside the name ("ivoire").
  if (folded.includes(q)) return 20;
  for (const alias of aliases) {
    if (foldForSearch(alias).includes(q)) return 10;
  }

  return 0;
}
