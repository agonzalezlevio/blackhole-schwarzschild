import type { OrbitalCamera } from '../camera/OrbitalCamera';
import type { RenderSettings } from '../black-hole/RenderSettings';
import type { Quality } from '../black-hole/Quality';
import type { ControlPanel, ControlPanelState } from './ControlPanel';
import type { Translator } from '../i18n/Translator';
import type { Localization } from '../i18n/Localization';
import type { Locale } from '../i18n/locales';

/**
 * Wires the settings panel and language selector to simulation state and the
 * resize/quality behavior, and keeps localized labels (pause/resume, static
 * text) in sync on locale change.
 */
export class ControlsController {
  constructor(
    private readonly settings: RenderSettings,
    private readonly camera: OrbitalCamera,
    private readonly panel: ControlPanel,
    private readonly localization: Localization,
    private readonly translator: Translator,
    private readonly resize: () => void,
    private readonly persistLocale: (locale: Locale) => void,
  ) {}

  bind(): void {
    this.panel.reflect(this.snapshot());
    this.panel.setPauseLabel(this.pauseLabel());

    this.panel.onBloom((v) => this.settings.setBloom(v));
    this.panel.onExposure((v) => this.settings.setExposure(v));
    this.panel.onDiskGain((v) => this.settings.setDiskGain(v));
    this.panel.onDoppler((v) => this.settings.setDoppler(v));
    this.panel.onAutoOrbit((enabled) => {
      this.settings.autoOrbit = enabled;
    });
    this.panel.onQuality((quality) => this.changeQuality(quality));
    this.panel.onPauseToggle(() => {
      this.settings.togglePause();
      this.panel.setPauseLabel(this.pauseLabel());
    });
    this.panel.onReset(() => this.camera.reset());

    this.localization.onLanguageChange((locale) => this.changeLocale(locale));
  }

  private changeQuality(quality: Quality): void {
    this.settings.quality = quality;
    this.resize();
  }

  private changeLocale(locale: Locale): void {
    this.translator.setLocale(locale);
    this.localization.applyStatic(this.translator.t);
    this.localization.setLanguage(locale);
    this.panel.setPauseLabel(this.pauseLabel());
    this.persistLocale(locale);
  }

  private pauseLabel(): string {
    return this.settings.paused
      ? this.translator.t('panel.resumeDisk')
      : this.translator.t('panel.pauseDisk');
  }

  private snapshot(): ControlPanelState {
    return {
      bloom: this.settings.bloom,
      exposure: this.settings.exposure,
      diskGain: this.settings.diskGain,
      doppler: this.settings.doppler,
      quality: this.settings.quality,
      autoOrbit: this.settings.autoOrbit,
    };
  }
}
