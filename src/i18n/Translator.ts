import { messages, type MessageKey } from './messages';
import { DEFAULT_LOCALE, type Locale } from './locales';

export type TranslateFn = (key: MessageKey) => string;

/** Holds the active locale and resolves message keys, falling back to the
 *  default locale and finally the key itself if a translation is missing. */
export class Translator {
  private current: Locale;

  constructor(locale: Locale) {
    this.current = locale;
  }

  get locale(): Locale {
    return this.current;
  }

  setLocale(locale: Locale): void {
    this.current = locale;
  }

  readonly t: TranslateFn = (key) =>
    messages[this.current][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}
