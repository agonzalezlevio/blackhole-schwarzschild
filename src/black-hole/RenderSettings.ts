import type { Resolution } from './Resolution';
import { QUALITY_PROFILES, type Quality, type QualityProfile } from './Quality';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Allowed range of every continuous control, mirrored by the UI sliders. */
export const SETTING_RANGES = {
  bloom: { min: 0, max: 2.5 },
  exposure: { min: 0.4, max: 2 },
  diskGain: { min: 0.2, max: 2 },
  doppler: { min: 0, max: 1 },
} as const;

const MAX_DEVICE_PIXEL_RATIO = 1.5;
/** Upper bound on rendered pixels to keep the fragment shader affordable. */
const PIXEL_BUDGET = 2.3e6;

/**
 * User-tunable rendering state. It validates its own ranges and derives the
 * render resolution, but knows nothing about the GPU or the DOM.
 */
export class RenderSettings {
  bloom = 1.15;
  exposure = 1.0;
  diskGain = 1.0;
  doppler = 0.55;
  autoOrbit = true;
  paused = false;
  quality: Quality = 'med';

  setBloom(v: number): void {
    this.bloom = clamp(v, SETTING_RANGES.bloom.min, SETTING_RANGES.bloom.max);
  }

  setExposure(v: number): void {
    this.exposure = clamp(v, SETTING_RANGES.exposure.min, SETTING_RANGES.exposure.max);
  }

  setDiskGain(v: number): void {
    this.diskGain = clamp(v, SETTING_RANGES.diskGain.min, SETTING_RANGES.diskGain.max);
  }

  setDoppler(v: number): void {
    this.doppler = clamp(v, SETTING_RANGES.doppler.min, SETTING_RANGES.doppler.max);
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  get qualityProfile(): QualityProfile {
    return QUALITY_PROFILES[this.quality];
  }

  /**
   * Resolution for the given viewport, scaled by the quality tier and device
   * pixel ratio, then shrunk uniformly if it would exceed the pixel budget.
   */
  computeResolution(
    windowWidth: number,
    windowHeight: number,
    devicePixelRatio: number,
  ): Resolution {
    const dpr = Math.min(devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const s = this.qualityProfile.scale * dpr;
    let w = Math.round(windowWidth * s);
    let h = Math.round(windowHeight * s);

    if (w * h > PIXEL_BUDGET) {
      const k = Math.sqrt(PIXEL_BUDGET / (w * h));
      w = Math.round(w * k);
      h = Math.round(h * k);
    }

    return { width: Math.max(2, w), height: Math.max(2, h) };
  }
}
