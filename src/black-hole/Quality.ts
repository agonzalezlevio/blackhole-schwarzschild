/** Render quality tiers. `steps` bounds the geodesic integration; `scale` is
 *  the render-resolution multiplier applied on top of device pixel ratio. */
export type Quality = 'low' | 'med' | 'high';

export interface QualityProfile {
  readonly steps: number;
  readonly scale: number;
}

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  low: { steps: 70, scale: 0.5 },
  med: { steps: 120, scale: 0.75 },
  high: { steps: 200, scale: 1.0 },
};

export function isQuality(value: string): value is Quality {
  return value === 'low' || value === 'med' || value === 'high';
}
