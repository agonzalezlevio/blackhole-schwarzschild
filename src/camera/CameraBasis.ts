import type { Vec3 } from '../shared/Vec3';

/**
 * Orthonormal camera frame. Columns of the basis matrix consumed by the
 * ray-marching shader: a view ray is `right * ndc.x + up * ndc.y + forward`.
 */
export interface CameraBasis {
  readonly right: Vec3;
  readonly up: Vec3;
  readonly forward: Vec3;
}
