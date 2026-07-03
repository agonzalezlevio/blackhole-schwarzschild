import { Vec3 } from '../shared/Vec3';
import type { CameraBasis } from './CameraBasis';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const WORLD_UP = new Vec3(0, 1, 0);

/** Default framing, also used by "reset view". */
export const DEFAULT_VIEW = { azimuth: 0.6, polar: 1.45, distance: 27 } as const;

const MIN_DISTANCE = 11;
const MAX_DISTANCE = 50;
const MIN_POLAR = 0.18;
const MAX_POLAR = Math.PI - 0.18;

/** Inertia damping (per second), auto-orbit rate, idle delay, zoom smoothing. */
const SPIN_DAMPING = 4.5;
const AUTO_ORBIT_RATE = 0.05;
const IDLE_BEFORE_AUTO_ORBIT = 3.5;
const DISTANCE_SMOOTHING = 6;

export interface CameraPose {
  readonly position: Vec3;
  readonly basis: CameraBasis;
}

export interface CameraUpdate {
  /** True while the user is actively dragging/pinching (freezes inertia). */
  readonly interacting: boolean;
  readonly autoOrbit: boolean;
  /** Seconds since the last user interaction. */
  readonly idle: number;
}

/**
 * Spherical orbit camera around the origin, with drag inertia, smoothed zoom
 * and idle auto-orbit. Angles are in radians; sensitivity (pixels -> radians)
 * lives in the input controller, not here.
 */
export class OrbitalCamera {
  private azimuth: number = DEFAULT_VIEW.azimuth;
  private polar: number = DEFAULT_VIEW.polar;
  private distance: number = DEFAULT_VIEW.distance;
  private targetDistance: number = DEFAULT_VIEW.distance;
  private spinAzimuth = 0;
  private spinPolar = 0;

  /** Rotate the view. Positive `dPolar` tilts toward the pole. */
  orbitBy(dAzimuth: number, dPolar: number): void {
    this.azimuth += dAzimuth;
    this.polar = clamp(this.polar + dPolar, MIN_POLAR, MAX_POLAR);
  }

  /** Seed post-release inertia (radians/frame). */
  setSpin(spinAzimuth: number, spinPolar: number): void {
    this.spinAzimuth = spinAzimuth;
    this.spinPolar = spinPolar;
  }

  /** Multiply the target distance (e.g. wheel/pinch), clamped to range. */
  zoomBy(factor: number): void {
    this.targetDistance = clamp(this.targetDistance * factor, MIN_DISTANCE, MAX_DISTANCE);
  }

  reset(): void {
    this.azimuth = DEFAULT_VIEW.azimuth;
    this.polar = DEFAULT_VIEW.polar;
    this.targetDistance = DEFAULT_VIEW.distance;
    this.spinAzimuth = 0;
    this.spinPolar = 0;
  }

  /** Advance inertia, idle auto-orbit and distance smoothing by `dt` seconds. */
  update(dt: number, { interacting, autoOrbit, idle }: CameraUpdate): void {
    if (!interacting) {
      this.azimuth += this.spinAzimuth;
      this.polar += this.spinPolar;
      const damping = Math.exp(-dt * SPIN_DAMPING);
      this.spinAzimuth *= damping;
      this.spinPolar *= damping;
      if (autoOrbit && idle > IDLE_BEFORE_AUTO_ORBIT) {
        this.azimuth += dt * AUTO_ORBIT_RATE;
      }
      this.polar = clamp(this.polar, MIN_POLAR, MAX_POLAR);
    }
    this.distance += (this.targetDistance - this.distance) * Math.min(1, dt * DISTANCE_SMOOTHING);
  }

  /** Current world position and orthonormal basis looking at the origin. */
  pose(): CameraPose {
    const sinPolar = Math.sin(this.polar);
    const cosPolar = Math.cos(this.polar);
    const position = new Vec3(
      this.distance * sinPolar * Math.cos(this.azimuth),
      this.distance * cosPolar,
      this.distance * sinPolar * Math.sin(this.azimuth),
    );
    const forward = position.negate().normalize();
    const right = forward.cross(WORLD_UP).normalize();
    const up = right.cross(forward);
    return { position, basis: { right, up, forward } };
  }
}
