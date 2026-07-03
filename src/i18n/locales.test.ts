import { describe, it, expect } from 'vitest';
import { detectLocale, isLocale, DEFAULT_LOCALE } from './locales';

describe('detectLocale', () => {
  it('matches on the primary subtag', () => {
    expect(detectLocale(['en-US'])).toBe('en');
    expect(detectLocale(['ES'])).toBe('es');
  });

  it('picks the first supported candidate in order', () => {
    expect(detectLocale(['', 'fr', 'en'])).toBe('en');
  });

  it('falls back to the default when nothing matches', () => {
    expect(detectLocale(['fr', 'de'])).toBe(DEFAULT_LOCALE);
    expect(detectLocale([])).toBe(DEFAULT_LOCALE);
  });
});

describe('isLocale', () => {
  it('recognizes supported locales only', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
});
