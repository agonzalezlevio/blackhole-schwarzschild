import type { RenderSettings } from './RenderSettings';
import type { ThreeRenderer } from './renderer/ThreeRenderer';
import type { Viewport } from '../shared/Viewport';

/**
 * Recompute the render resolution from the current viewport and quality tier,
 * then reallocate the renderer's targets. Runs on init, window resize and
 * quality change.
 */
export function resizeRenderer(
  settings: RenderSettings,
  viewport: Viewport,
  renderer: ThreeRenderer,
): void {
  const { width, height } = settings.computeResolution(
    viewport.width,
    viewport.height,
    viewport.devicePixelRatio,
  );
  renderer.resize(width, height);
}
