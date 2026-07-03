import type { Vec3 } from '../shared/Vec3';
import type { CameraBasis } from '../camera/CameraBasis';

/**
 * Everything the renderer needs to draw one frame, expressed in simulation
 * terms. Carries no GPU or framework types — the renderer maps it to uniforms.
 */
export interface RenderFrame {
  /** Accretion-disk animation time (advances only while unpaused). */
  readonly diskTime: number;
  /** Wall-clock elapsed time, used for temporal dithering / film grain. */
  readonly realTime: number;
  readonly cameraPosition: Vec3;
  readonly cameraBasis: CameraBasis;
  readonly steps: number;
  readonly diskGain: number;
  readonly doppler: number;
  readonly bloom: number;
  readonly exposure: number;
}
