export type Locale = 'es' | 'en';

/** Spanish is the default locale; English is the secondary translation. */
export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: string): value is Locale {
  return value === 'es' || value === 'en';
}

/**
 * Pick the first supported locale from an ordered list of candidates
 * (e.g. a stored preference followed by `navigator.languages`). Matches on the
 * two-letter primary subtag, so "en-US" resolves to "en". Falls back to the
 * default when nothing matches.
 */
export function detectLocale(candidates: readonly string[]): Locale {
  for (const candidate of candidates) {
    const primary = candidate.slice(0, 2).toLowerCase();
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}
