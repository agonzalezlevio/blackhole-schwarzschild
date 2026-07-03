import { describe, it, expect } from 'vitest';
import { Vec3 } from './Vec3';

describe('Vec3', () => {
  it('adds and subtracts componentwise', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);
    expect(a.add(b)).toEqual(new Vec3(5, 7, 9));
    expect(b.sub(a)).toEqual(new Vec3(3, 3, 3));
  });

  it('scales and negates', () => {
    expect(new Vec3(1, -2, 3).scale(2)).toEqual(new Vec3(2, -4, 6));
    expect(new Vec3(1, -2, 3).negate()).toEqual(new Vec3(-1, 2, -3));
  });

  it('computes dot and cross products', () => {
    expect(new Vec3(1, 0, 0).dot(new Vec3(0, 1, 0))).toBe(0);
    expect(new Vec3(1, 0, 0).cross(new Vec3(0, 1, 0))).toEqual(new Vec3(0, 0, 1));
  });

  it('reports length and normalizes to unit length', () => {
    expect(new Vec3(3, 4, 0).length).toBe(5);
    const n = new Vec3(0, 0, 5).normalize();
    expect(n.length).toBeCloseTo(1);
    expect(n).toEqual(new Vec3(0, 0, 1));
  });

  it('normalizing a zero vector yields zero (no NaN)', () => {
    expect(new Vec3(0, 0, 0).normalize()).toEqual(new Vec3(0, 0, 0));
  });
});
