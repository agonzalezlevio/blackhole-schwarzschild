import { describe, it, expect } from 'vitest';
import { Translator } from './Translator';

describe('Translator', () => {
  it('resolves keys in the active locale', () => {
    const t = new Translator('en');
    expect(t.t('title.heading')).toBe('Black hole');
    expect(t.t('panel.pauseDisk')).toBe('Pause disk');
  });

  it('switches locale at runtime', () => {
    const t = new Translator('en');
    t.setLocale('es');
    expect(t.locale).toBe('es');
    expect(t.t('title.heading')).toBe('Agujero negro');
  });
});
