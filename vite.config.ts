/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Static SPA: no backend. Node/pnpm are toolchain only.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scope coverage to the framework-free code; exclude the GPU / DOM adapters.
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/black-hole/renderer/**',
        'src/camera/PointerInput.ts',
        'src/controls/ControlPanel.ts',
        'src/i18n/Localization.ts',
        'src/shared/Viewport.ts',
        'src/shared/AnimationLoop.ts',
      ],
    },
  },
});
