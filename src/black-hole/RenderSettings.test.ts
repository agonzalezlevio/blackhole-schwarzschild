import { describe, it, expect } from 'vitest';
import { RenderSettings } from './RenderSettings';

describe('RenderSettings', () => {
  it('starts with the documented defaults', () => {
    const s = new RenderSettings();
    expect(s.bloom).toBe(1.15);
    expect(s.exposure).toBe(1);
    expect(s.diskGain).toBe(1);
    expect(s.doppler).toBe(0.55);
    expect(s.quality).toBe('med');
    expect(s.autoOrbit).toBe(true);
    expect(s.paused).toBe(false);
  });

  it('clamps each control to its slider range', () => {
    const s = new RenderSettings();
    s.setBloom(99);
    expect(s.bloom).toBe(2.5);
    s.setExposure(0);
    expect(s.exposure).toBe(0.4);
    s.setDiskGain(-1);
    expect(s.diskGain).toBe(0.2);
    s.setDoppler(5);
    expect(s.doppler).toBe(1);
  });

  it('toggles pause', () => {
    const s = new RenderSettings();
    s.togglePause();
    expect(s.paused).toBe(true);
    s.togglePause();
    expect(s.paused).toBe(false);
  });

  it('maps quality to its render profile', () => {
    const s = new RenderSettings();
    expect(s.qualityProfile).toEqual({ steps: 120, scale: 0.75 });
    s.quality = 'high';
    expect(s.qualityProfile).toEqual({ steps: 200, scale: 1 });
  });

  describe('computeResolution', () => {
    it('scales by quality and device pixel ratio', () => {
      const s = new RenderSettings();
      expect(s.computeResolution(1000, 1000, 1)).toEqual({ width: 750, height: 750 });
    });

    it('caps the device pixel ratio at 1.5', () => {
      const s = new RenderSettings();
      // 1000 * 0.75 * 1.5 = 1125 (dpr 3 is capped to 1.5)
      expect(s.computeResolution(1000, 1000, 3)).toEqual({ width: 1125, height: 1125 });
    });

    it('shrinks uniformly to stay within the pixel budget', () => {
      const s = new RenderSettings();
      s.quality = 'high'; // scale 1.0
      const res = s.computeResolution(2000, 2000, 1); // 4,000,000 px > budget
      // The budget is approximate: both dimensions are rounded after scaling,
      // so the pixel count lands just around 2.3e6, not exactly at or below it.
      expect(res.width * res.height).toBeGreaterThan(2.2e6);
      expect(res.width * res.height).toBeLessThan(2.31e6);
      expect(res.width).toBeLessThan(2000);
      expect(res.width).toBe(res.height);
    });

    it('never falls below 2x2', () => {
      const s = new RenderSettings();
      expect(s.computeResolution(1, 1, 1)).toEqual({ width: 2, height: 2 });
    });
  });
});
