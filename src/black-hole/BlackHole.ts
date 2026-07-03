/**
 * A Schwarzschild black hole, in geometric units where the Schwarzschild
 * radius is the unit of length (r_s = 1). These parameters are the single
 * source of truth for the raymarching shader, which receives them as
 * compile-time `#define`s (see renderer/ThreeRenderer).
 */
export class BlackHole {
  constructor(
    /** Schwarzschild radius / event horizon (unit length). */
    readonly schwarzschildRadius = 1.0,
    /** Inner edge of the accretion disk (~ISCO). */
    readonly diskInner = 2.6,
    /** Outer edge of the accretion disk. */
    readonly diskOuter = 14.0,
    /** Radius at which a ray is considered to have escaped to the sky. */
    readonly escapeRadius = 70.0,
  ) {}

  /** Photon sphere: unstable circular photon orbit at r = 1.5 r_s. */
  get photonSphereRadius(): number {
    return 1.5 * this.schwarzschildRadius;
  }
}
