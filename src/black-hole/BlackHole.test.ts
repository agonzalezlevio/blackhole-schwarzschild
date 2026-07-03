import { describe, it, expect } from 'vitest';
import { BlackHole } from './BlackHole';

describe('BlackHole', () => {
  it('uses Schwarzschild units by default (r_s = 1)', () => {
    const bh = new BlackHole();
    expect(bh.schwarzschildRadius).toBe(1);
    expect(bh.diskInner).toBe(2.6);
    expect(bh.diskOuter).toBe(14);
    expect(bh.escapeRadius).toBe(70);
  });

  it('derives the photon sphere at 1.5 r_s', () => {
    expect(new BlackHole().photonSphereRadius).toBe(1.5);
    expect(new BlackHole(2).photonSphereRadius).toBe(3);
  });
});
