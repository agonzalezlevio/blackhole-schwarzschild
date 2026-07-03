interface PointerPos {
  x: number;
  y: number;
}

/**
 * Pointer/wheel gestures on the canvas: single-pointer drag, two-pointer pinch
 * and wheel zoom. Emits raw device-space deltas; orbit semantics live in
 * PointerControls.
 */
export class PointerInput {
  private readonly pointers = new Map<number, PointerPos>();
  private pinchDist = 0;

  private dragCb: ((dx: number, dy: number) => void) | null = null;
  private pinchCb: ((scale: number) => void) | null = null;
  private wheelCb: ((deltaY: number) => void) | null = null;
  private interactCb: (() => void) | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerup', this.handleUp);
    canvas.addEventListener('pointercancel', this.handleUp);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  isActive(): boolean {
    return this.pointers.size > 0;
  }

  onDrag(callback: (dx: number, dy: number) => void): void {
    this.dragCb = callback;
  }

  onPinch(callback: (scale: number) => void): void {
    this.pinchCb = callback;
  }

  onWheel(callback: (deltaY: number) => void): void {
    this.wheelCb = callback;
  }

  onInteract(callback: () => void): void {
    this.interactCb = callback;
  }

  private readonly handleDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    this.canvas.classList.add('dragging');
    this.interactCb?.();
  };

  private readonly handleMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.interactCb?.();

    if (this.pointers.size === 1) {
      this.dragCb?.(dx, dy);
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0) this.pinchCb?.(this.pinchDist / Math.max(d, 1));
      this.pinchDist = d;
    }
  };

  private readonly handleUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    if (this.pointers.size === 0) this.canvas.classList.remove('dragging');
  };

  private readonly handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.wheelCb?.(e.deltaY);
    this.interactCb?.();
  };
}
