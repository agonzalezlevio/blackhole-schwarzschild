import type { TranslateFn } from './Translator';
import type { MessageKey } from './messages';
import { isLocale, type Locale } from './locales';

/**
 * DOM adapter for localization. Applies translations to every `[data-i18n]`
 * node and the document title, and bridges the `#lang` selector.
 */
export class Localization {
  private readonly select = document.getElementById('lang') as HTMLSelectElement | null;

  applyStatic(translate: TranslateFn): void {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = translate(key as MessageKey);
    });
    document.title = translate('doc.title');
  }

  setLanguage(locale: Locale): void {
    if (this.select) this.select.value = locale;
    document.documentElement.lang = locale;
  }

  onLanguageChange(callback: (locale: Locale) => void): void {
    this.select?.addEventListener('change', () => {
      if (this.select && isLocale(this.select.value)) callback(this.select.value);
    });
  }
}
