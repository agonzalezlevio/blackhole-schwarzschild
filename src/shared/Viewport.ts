/** The drawable surface, backed by the browser window. */
export class Viewport {
  get width(): number {
    return window.innerWidth;
  }

  get height(): number {
    return window.innerHeight;
  }

  get devicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  onResize(callback: () => void): void {
    window.addEventListener('resize', callback);
  }
}
