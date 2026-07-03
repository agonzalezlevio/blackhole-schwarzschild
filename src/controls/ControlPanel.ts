import { isQuality, type Quality } from '../black-hole/Quality';

/** Snapshot pushed into the controls so the view reflects the current state. */
export interface ControlPanelState {
  readonly bloom: number;
  readonly exposure: number;
  readonly diskGain: number;
  readonly doppler: number;
  readonly quality: Quality;
  readonly autoOrbit: boolean;
}

function requireEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const formatValue = (v: number): string => v.toFixed(2);

/**
 * DOM adapter for the settings panel. Owns value-label formatting and the
 * collapse toggle; emits typed values, accepts already-formatted strings back
 * (localized labels, FPS readout).
 */
export class ControlPanel {
  private readonly bloom = requireEl<HTMLInputElement>('bloom');
  private readonly bloomV = requireEl<HTMLElement>('bloomV');
  private readonly expo = requireEl<HTMLInputElement>('expo');
  private readonly expoV = requireEl<HTMLElement>('expoV');
  private readonly disk = requireEl<HTMLInputElement>('disk');
  private readonly diskV = requireEl<HTMLElement>('diskV');
  private readonly dopp = requireEl<HTMLInputElement>('dopp');
  private readonly doppV = requireEl<HTMLElement>('doppV');
  private readonly quality = requireEl<HTMLSelectElement>('quality');
  private readonly autoOrbit = requireEl<HTMLInputElement>('autorb');
  private readonly pauseBtn = requireEl<HTMLButtonElement>('pauseBtn');
  private readonly resetBtn = requireEl<HTMLButtonElement>('resetBtn');
  private readonly fps = requireEl<HTMLElement>('fps');

  constructor() {
    const panel = requireEl<HTMLElement>('panel');
    const head = requireEl<HTMLElement>('panelHead');
    const toggle = requireEl<HTMLElement>('panelToggle');
    head.addEventListener('click', () => {
      panel.classList.toggle('closed');
      toggle.textContent = panel.classList.contains('closed') ? '+' : '–';
    });
  }

  onBloom(callback: (value: number) => void): void {
    this.bindSlider(this.bloom, this.bloomV, callback);
  }
  onExposure(callback: (value: number) => void): void {
    this.bindSlider(this.expo, this.expoV, callback);
  }
  onDiskGain(callback: (value: number) => void): void {
    this.bindSlider(this.disk, this.diskV, callback);
  }
  onDoppler(callback: (value: number) => void): void {
    this.bindSlider(this.dopp, this.doppV, callback);
  }

  onQuality(callback: (quality: Quality) => void): void {
    this.quality.addEventListener('change', () => {
      if (isQuality(this.quality.value)) callback(this.quality.value);
    });
  }

  onAutoOrbit(callback: (enabled: boolean) => void): void {
    this.autoOrbit.addEventListener('change', () => callback(this.autoOrbit.checked));
  }

  onPauseToggle(callback: () => void): void {
    this.pauseBtn.addEventListener('click', callback);
  }

  onReset(callback: () => void): void {
    this.resetBtn.addEventListener('click', callback);
  }

  reflect(state: ControlPanelState): void {
    this.setSlider(this.bloom, this.bloomV, state.bloom);
    this.setSlider(this.expo, this.expoV, state.exposure);
    this.setSlider(this.disk, this.diskV, state.diskGain);
    this.setSlider(this.dopp, this.doppV, state.doppler);
    this.quality.value = state.quality;
    this.autoOrbit.checked = state.autoOrbit;
  }

  setPauseLabel(label: string): void {
    this.pauseBtn.textContent = label;
  }

  showFps(text: string): void {
    this.fps.textContent = text;
  }

  private bindSlider(
    input: HTMLInputElement,
    valueLabel: HTMLElement,
    callback: (value: number) => void,
  ): void {
    input.addEventListener('input', () => {
      const value = parseFloat(input.value);
      valueLabel.textContent = formatValue(value);
      callback(value);
    });
  }

  private setSlider(input: HTMLInputElement, valueLabel: HTMLElement, value: number): void {
    input.value = String(value);
    valueLabel.textContent = formatValue(value);
  }
}
