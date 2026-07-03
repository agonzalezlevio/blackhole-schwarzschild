<div align="center">

# Black Hole

**Real-time black hole gravitational-lensing simulator.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![three.js](https://img.shields.io/badge/three.js-0.160-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

**[· Live demo ·](https://agonzalezlevio.github.io/blackhole-schwarzschild/)**

</div>

## Overview

A browser-based simulator that renders a Schwarzschild black hole with real gravitational lensing. Light bending is computed per fragment on the GPU by integrating the null geodesic of the Schwarzschild metric in vector form — `d²x/dλ² = −3⁄2 · h² · x / r⁵` (with `r_s = 1`), where `h = |x × v|` is the photon's conserved specific angular momentum. This reproduces the event horizon, the photon ring at `r = 1.5 r_s`, and the upper/lower images of the accretion disk. The disk and star field are procedural; the disk is shaded with approximate relativistic Doppler beaming and gravitational redshift, then composited through an HDR bloom + ACES tone-mapping pipeline.

No backend: a static single-page app. Node and pnpm are toolchain only.

## Features

- **Physically-based lensing** - Schwarzschild null geodesics ray-marched on the GPU (GLSL3)
- **Procedural accretion disk** - Keplerian shear, Doppler beaming, gravitational redshift
- **HDR post-processing** - brightness threshold, two-level Gaussian bloom, ACES tone mapping, vignette, grain
- **Orbit camera** - drag to orbit, wheel / pinch to zoom, inertia, idle auto-orbit
- **Live controls** - quality, bloom, exposure, disk brightness, Doppler, pause, reset
- **Adaptive resolution** - quality tiers × device pixel ratio, capped by a pixel budget
- **Internationalization** - Spanish / English, auto-detected and persisted, switchable at runtime
- **WebGL2 fallback** - localized message when the context is unavailable

## Architecture

Screaming (feature-based) architecture: the top-level folders under `src/` name what the app _does_ — `black-hole`, `camera`, `controls`, `i18n` — not technical layers. ESLint (`eslint-plugin-boundaries`) enforces the feature boundaries: dependencies flow one way, `shared` and `i18n` are leaves, and `three` lives only in `black-hole`, so the physics, camera, settings and i18n code stays framework-free and unit-tested.

```
        main  (composition root, wires everything)
          │
          ▼
     controls ──▶ black-hole ──▶ camera ──▶ shared
          └──▶ i18n         (renderer/ = only three.js)
```

- **black-hole** — the simulation core: Schwarzschild physics (`BlackHole`), tunable `RenderSettings` + resolution/pixel-budget math, the per-frame `SimulationLoop` (plus a `resizeRenderer` helper), and the GPU `renderer/` (the only place that imports `three.js`). Physics constants flow from `BlackHole` into the shader as `#define`s, so the GLSL has no magic numbers.
- **camera** — the orbit camera (`OrbitalCamera`: inertia, zoom, auto-orbit, pose) and pointer input (`PointerInput` raw gestures → `PointerControls` pixel→radian sensitivity).
- **controls** — the settings panel (`ControlPanel`) and the `ControlsController` that binds it to simulation state, localized labels and the quality/resize behavior.
- **i18n** — a dependency-free localization module: locale detection, message catalog, translator, and the DOM adapter.
- **shared** — cross-cutting primitives with no feature knowledge: `Vec3` math, `Viewport`, `AnimationLoop`.

## Installation

**Prerequisites:** Node.js >= 22, pnpm >= 10

```bash
git clone https://github.com/agonzalezlevio/blackhole-schwarzschild
cd blackhole-schwarzschild
pnpm install
```

## Usage

```bash
pnpm dev          # start dev server -> http://localhost:5173
pnpm build        # tsc --noEmit + vite build -> dist/
pnpm preview      # preview the production build
```

Quality can be preset via the `?q=low|med|high` query parameter.

### Quality checks

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint (incl. feature-boundary rules)
pnpm test         # vitest run
pnpm format       # prettier --write .
```

### Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to **GitHub Pages**. Enable it once under **Settings → Pages → Source: GitHub Actions**.

## Project Structure

```
src/
├── black-hole/ ....................... Simulation core: physics + settings + renderer
│   ├── BlackHole.ts .................. Schwarzschild parameters (source of truth for the shader)
│   ├── RenderSettings.ts ............. Tunable settings + resolution/pixel-budget math
│   ├── Quality.ts .................... Quality tiers -> { steps, scale }
│   ├── Resolution.ts ................. Render-target size value object
│   ├── RenderFrame.ts ................ Everything the renderer needs, in simulation terms
│   ├── SimulationLoop.ts ............. Per-frame orchestration (camera, disk time, frame)
│   ├── resize.ts ..................... Viewport + quality -> renderer resize
│   └── renderer/ ..................... The only place that imports three.js
│       ├── ThreeRenderer.ts ......... WebGL2 renderer + 5-pass bloom/tone-map pipeline
│       └── shaders/
│           ├── fullscreen.vert.glsl . Full-screen triangle
│           ├── blackhole.frag.glsl .. Schwarzschild geodesic raymarching + disk + sky
│           ├── bright.frag.glsl ..... Bloom brightness threshold
│           ├── blur.frag.glsl ....... Separable Gaussian blur
│           └── composite.frag.glsl .. Composite, ACES, vignette, grain
│
├── camera/ ........................... Orbit camera & pointer input
│   ├── OrbitalCamera.ts .............. Spherical orbit camera: inertia, zoom, auto-orbit, pose
│   ├── CameraBasis.ts ............... Orthonormal camera frame (right, up, forward)
│   ├── PointerInput.ts .............. Pointer capture, drag, pinch, wheel (raw deltas)
│   └── PointerControls.ts ........... Gestures -> camera (pixel->radian sensitivity)
│
├── controls/ ......................... Settings panel
│   ├── ControlPanel.ts .............. Sliders, selects, buttons, FPS, collapse
│   └── ControlsController.ts ........ Panel + language selector, localized labels
│
├── i18n/ ............................. Dependency-free localization
│   ├── locales.ts ................... Locale type + detection
│   ├── messages.ts .................. es / en message catalog
│   ├── Translator.ts ................ Active locale + key resolution
│   └── Localization.ts .............. Applies [data-i18n], title, <html lang>, #lang
│
├── shared/ ........................... Cross-cutting primitives (no feature knowledge)
│   ├── Vec3.ts ...................... Immutable 3D vector
│   ├── Viewport.ts .................. window size / DPR / resize
│   └── AnimationLoop.ts ............. requestAnimationFrame driver (dt clamp)
│
├── styles/main.css ................... HUD / panel styling
├── main.ts ........................... Composition root: wires all features
└── vite-env.d.ts ..................... Vite client types (?raw glsl imports)

public/favicon.svg ..................... App icon (SVG)
index.html ............................. Entry: canvas, HUD, panel, module script
```

## Testing

```bash
pnpm test              # run all tests once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report (v8)
```

29 tests across 6 suites cover the framework-free code: vector math, camera pose / inertia / clamps, settings ranges, resolution budget, locale detection, and translation.

## License

All rights reserved.

## Author

**agonzalezlevio** - [github.com/agonzalezlevio](https://github.com/agonzalezlevio)
