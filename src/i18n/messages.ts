import type { Locale } from './locales';

/** Every user-facing string, keyed by a stable id. */
export type MessageKey =
  | 'doc.title'
  | 'title.heading'
  | 'title.subtitle'
  | 'hint'
  | 'panel.head'
  | 'panel.quality'
  | 'quality.low'
  | 'quality.med'
  | 'quality.high'
  | 'panel.bloom'
  | 'panel.exposure'
  | 'panel.diskBrightness'
  | 'panel.doppler'
  | 'panel.autoOrbit'
  | 'panel.pauseDisk'
  | 'panel.resumeDisk'
  | 'panel.resetView'
  | 'panel.language'
  | 'fallback';

export const messages: Record<Locale, Record<MessageKey, string>> = {
  es: {
    'doc.title': 'Agujero negro · Lente gravitacional',
    'title.heading': 'Agujero negro',
    'title.subtitle': 'Lente gravitacional · métrica de Schwarzschild',
    hint: 'Arrastra para orbitar · rueda o pellizco para acercar',
    'panel.head': 'Controles',
    'panel.quality': 'Calidad',
    'quality.low': 'Baja',
    'quality.med': 'Media',
    'quality.high': 'Alta',
    'panel.bloom': 'Bloom',
    'panel.exposure': 'Exposición',
    'panel.diskBrightness': 'Brillo del disco',
    'panel.doppler': 'Efecto Doppler',
    'panel.autoOrbit': 'Órbita automática',
    'panel.pauseDisk': 'Pausar disco',
    'panel.resumeDisk': 'Reanudar disco',
    'panel.resetView': 'Reiniciar vista',
    'panel.language': 'Idioma',
    fallback:
      'Este simulador necesita WebGL2. Prueba con una versión reciente de Chrome, Firefox, Edge o Safari.',
  },
  en: {
    'doc.title': 'Black hole · Gravitational lensing',
    'title.heading': 'Black hole',
    'title.subtitle': 'Gravitational lensing · Schwarzschild metric',
    hint: 'Drag to orbit · wheel or pinch to zoom',
    'panel.head': 'Controls',
    'panel.quality': 'Quality',
    'quality.low': 'Low',
    'quality.med': 'Medium',
    'quality.high': 'High',
    'panel.bloom': 'Bloom',
    'panel.exposure': 'Exposure',
    'panel.diskBrightness': 'Disk brightness',
    'panel.doppler': 'Doppler effect',
    'panel.autoOrbit': 'Auto orbit',
    'panel.pauseDisk': 'Pause disk',
    'panel.resumeDisk': 'Resume disk',
    'panel.resetView': 'Reset view',
    'panel.language': 'Language',
    fallback:
      'This simulator needs WebGL2. Try a recent version of Chrome, Firefox, Edge, or Safari.',
  },
};
