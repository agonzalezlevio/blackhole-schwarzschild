import type { OrbitalCamera } from './OrbitalCamera';
import type { PointerInput } from './PointerInput';

/** Pixel-to-radian sensitivities and wheel zoom rate (view concerns). */
const DRAG_TO_RADIANS = 0.005;
const SPIN_TO_RADIANS = 0.004;
const WHEEL_ZOOM_RATE = 0.0012;

/**
 * Translates raw pointer gestures into camera motion. Owns the input sensitivity
 * constants so the camera stays unit-agnostic (radians in, radians out).
 */
export class PointerControls {
  constructor(
    private readonly camera: OrbitalCamera,
    private readonly input: PointerInput,
    private readonly onInteract: () => void,
  ) {}

  bind(): void {
    this.input.onDrag((dx, dy) => {
      this.camera.orbitBy(-dx * DRAG_TO_RADIANS, -dy * DRAG_TO_RADIANS);
      this.camera.setSpin(-dx * SPIN_TO_RADIANS, -dy * SPIN_TO_RADIANS);
    });
    this.input.onPinch((scale) => this.camera.zoomBy(scale));
    this.input.onWheel((deltaY) => this.camera.zoomBy(Math.exp(deltaY * WHEEL_ZOOM_RATE)));
    this.input.onInteract(this.onInteract);
  }
}
