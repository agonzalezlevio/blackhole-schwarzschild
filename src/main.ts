import { BlackHole } from './black-hole/BlackHole';
import { RenderSettings } from './black-hole/RenderSettings';
import { isQuality } from './black-hole/Quality';
import { SimulationLoop } from './black-hole/SimulationLoop';
import { resizeRenderer } from './black-hole/resize';
import { ThreeRenderer } from './black-hole/renderer/ThreeRenderer';

import { OrbitalCamera } from './camera/OrbitalCamera';
import { PointerInput } from './camera/PointerInput';
import { PointerControls } from './camera/PointerControls';

import { ControlPanel } from './controls/ControlPanel';
import { ControlsController } from './controls/ControlsController';

import { Translator } from './i18n/Translator';
import { detectLocale, type Locale } from './i18n/locales';
import { Localization } from './i18n/Localization';

import { Viewport } from './shared/Viewport';
import { AnimationLoop } from './shared/AnimationLoop';

const LOCALE_STORAGE_KEY = 'bh.locale';

function readLocale(): Locale {
  let stored = '';
  try {
    stored = localStorage.getItem(LOCALE_STORAGE_KEY) ?? '';
  } catch {
    // localStorage may be unavailable (private mode); fall back to navigator.
  }
  const candidates = [stored, ...(navigator.languages ?? [navigator.language])].filter(Boolean);
  return detectLocale(candidates);
}

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore: persistence is best-effort.
  }
}

function showFallback(): void {
  const fallback = document.getElementById('fallback');
  if (fallback) fallback.style.display = 'flex';
}

/** Composition root: wire the black-hole, camera, controls and i18n features. */
function main(): void {
  const canvas = document.getElementById('c') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('Missing #c canvas');

  const translator = new Translator(readLocale());
  const localization = new Localization();
  // Localize the static DOM before rendering; covers both the normal and the
  // WebGL2-fallback paths.
  localization.applyStatic(translator.t);
  localization.setLanguage(translator.locale);

  const blackHole = new BlackHole();
  const camera = new OrbitalCamera();
  const settings = new RenderSettings();

  // Optional ?q=low|med|high quality override.
  const urlQuality = new URLSearchParams(location.search).get('q');
  if (urlQuality && isQuality(urlQuality)) settings.quality = urlQuality;

  let renderer: ThreeRenderer;
  try {
    renderer = new ThreeRenderer(canvas, blackHole);
  } catch {
    showFallback();
    return;
  }

  const viewport = new Viewport();
  const input = new PointerInput(canvas);
  const panel = new ControlPanel();
  const loop = new AnimationLoop();

  const resize = (): void => resizeRenderer(settings, viewport, renderer);
  const simulation = new SimulationLoop(camera, settings, renderer, input, (text) =>
    panel.showFps(text),
  );

  new PointerControls(camera, input, () => simulation.markInteraction()).bind();
  new ControlsController(
    settings,
    camera,
    panel,
    localization,
    translator,
    resize,
    persistLocale,
  ).bind();

  viewport.onResize(resize);
  resize();
  loop.start((dt, elapsed) => simulation.tick(dt, elapsed));
}

main();
