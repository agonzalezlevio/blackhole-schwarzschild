import type { OrbitalCamera } from '../camera/OrbitalCamera';
import type { PointerInput } from '../camera/PointerInput';
import type { RenderSettings } from './RenderSettings';
import type { RenderFrame } from './RenderFrame';
import type { ThreeRenderer } from './renderer/ThreeRenderer';

export type StatsReporter = (text: string) => void;

const FPS_INTERVAL = 0.5;

/**
 * The per-frame orchestrator. Advances disk time and camera motion, assembles a
 * RenderFrame from simulation state and hands it to the renderer. Contains no
 * GPU calls — it is pure orchestration over the renderer, camera and settings.
 */
export class SimulationLoop {
  private diskTime = 0;
  private elapsed = 0;
  private lastInteraction = -10;

  private fpsAccum = 0;
  private fpsCount = 0;
  private fpsLast = 0;

  constructor(
    private readonly camera: OrbitalCamera,
    private readonly settings: RenderSettings,
    private readonly renderer: ThreeRenderer,
    private readonly input: PointerInput,
    private readonly reportStats: StatsReporter,
  ) {}

  /** Reset the idle timer (call whenever the user interacts). */
  markInteraction(): void {
    this.lastInteraction = this.elapsed;
  }

  /** Advance and render one frame. */
  tick(dt: number, elapsed: number): void {
    this.elapsed = elapsed;
    if (!this.settings.paused) this.diskTime += dt;

    this.camera.update(dt, {
      interacting: this.input.isActive(),
      autoOrbit: this.settings.autoOrbit,
      idle: elapsed - this.lastInteraction,
    });

    const pose = this.camera.pose();
    const frame: RenderFrame = {
      diskTime: this.diskTime,
      realTime: elapsed,
      cameraPosition: pose.position,
      cameraBasis: pose.basis,
      steps: this.settings.qualityProfile.steps,
      diskGain: this.settings.diskGain,
      doppler: this.settings.doppler,
      bloom: this.settings.bloom,
      exposure: this.settings.exposure,
    };
    this.renderer.render(frame);

    this.updateFps(dt, elapsed);
  }

  private updateFps(dt: number, elapsed: number): void {
    this.fpsAccum += dt;
    this.fpsCount += 1;
    if (elapsed - this.fpsLast > FPS_INTERVAL) {
      const fps = Math.round(this.fpsCount / Math.max(this.fpsAccum, 1e-4));
      const { width, height } = this.renderer.getResolution();
      this.reportStats(`${fps} fps · ${width}×${height}`);
      this.fpsAccum = 0;
      this.fpsCount = 0;
      this.fpsLast = elapsed;
    }
  }
}
