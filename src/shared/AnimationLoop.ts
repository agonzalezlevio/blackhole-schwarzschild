/** A frame callback receiving the clamped delta and total elapsed seconds. */
export type FrameCallback = (dt: number, elapsed: number) => void;

/** Delta clamp (seconds): keeps physics stable after tab-switches / stalls. */
const MAX_DT = 0.05;

/** Frame driver backed by requestAnimationFrame. */
export class AnimationLoop {
  private last = 0;
  private elapsed = 0;
  private onFrame: FrameCallback | null = null;

  start(onFrame: FrameCallback): void {
    this.onFrame = onFrame;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number): void => {
    const raw = (now - this.last) / 1000;
    this.last = now;
    this.elapsed += raw; // wall-clock time (drives idle timer / grain)
    this.onFrame?.(Math.min(raw, MAX_DT), this.elapsed);
    requestAnimationFrame(this.frame);
  };
}
