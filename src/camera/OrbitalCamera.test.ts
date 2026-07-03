import { describe, it, expect } from 'vitest';
import { OrbitalCamera, DEFAULT_VIEW } from './OrbitalCamera';
import type { Vec3 } from '../shared/Vec3';

const still = { interacting: false, autoOrbit: false, idle: 0 };

function expectClose(a: Vec3, b: Vec3): void {
  expect(a.x).toBeCloseTo(b.x, 5);
  expect(a.y).toBeCloseTo(b.y, 5);
  expect(a.z).toBeCloseTo(b.z, 5);
}

describe('OrbitalCamera', () => {
  it('places the camera on a sphere of radius = distance, looking at the origin', () => {
    const { position, basis } = new OrbitalCamera().pose();
    expect(position.length).toBeCloseTo(DEFAULT_VIEW.distance, 4);
    // forward is the unit vector from the camera toward the origin
    expect(basis.forward.length).toBeCloseTo(1);
    expect(basis.forward.dot(position)).toBeCloseTo(-DEFAULT_VIEW.distance, 4);
  });

  it('produces an orthonormal basis', () => {
    const { basis } = new OrbitalCamera().pose();
    expect(basis.right.length).toBeCloseTo(1);
    expect(basis.up.length).toBeCloseTo(1);
    expect(basis.right.dot(basis.up)).toBeCloseTo(0);
    expect(basis.right.dot(basis.forward)).toBeCloseTo(0);
    expect(basis.up.dot(basis.forward)).toBeCloseTo(0);
  });

  it('clamps the polar angle so the camera never crosses a pole', () => {
    const top = new OrbitalCamera();
    top.orbitBy(0, -1000);
    expect(top.pose().position.y).toBeGreaterThan(0); // near, but not at, the top pole

    const bottom = new OrbitalCamera();
    bottom.orbitBy(0, 1000);
    expect(bottom.pose().position.y).toBeLessThan(0);
  });

  it('freezes inertia while the user is interacting', () => {
    const cam = new OrbitalCamera();
    const before = cam.pose().position;
    cam.setSpin(0.5, 0.2);
    cam.update(0.1, { ...still, interacting: true });
    expectClose(cam.pose().position, before);
  });

  it('coasts under inertia once released', () => {
    const cam = new OrbitalCamera();
    const before = cam.pose().position;
    cam.setSpin(0.5, 0);
    cam.update(0.1, still);
    expect(cam.pose().position.x).not.toBeCloseTo(before.x, 3);
  });

  it('smooths distance toward the zoom target within its range', () => {
    const cam = new OrbitalCamera();
    cam.zoomBy(10); // 27 * 10 -> clamped to max distance 50
    cam.update(1, still); // dt * 6 >= 1 -> snaps to target
    expect(cam.pose().position.length).toBeCloseTo(50, 3);

    const near = new OrbitalCamera();
    near.zoomBy(0.001); // -> clamped to min distance 11
    near.update(1, still);
    expect(near.pose().position.length).toBeCloseTo(11, 3);
  });

  it('applies idle auto-orbit only after the idle delay', () => {
    const cam = new OrbitalCamera();
    const before = cam.pose().position;
    cam.update(0.1, { interacting: false, autoOrbit: true, idle: 1 }); // below threshold
    expectClose(cam.pose().position, before);
    cam.update(0.1, { interacting: false, autoOrbit: true, idle: 10 }); // past threshold
    expect(cam.pose().position.x).not.toBeCloseTo(before.x, 6);
  });

  it('reset restores the default framing', () => {
    const fresh = new OrbitalCamera().pose().position;
    const cam = new OrbitalCamera();
    cam.orbitBy(1, 0.3);
    cam.setSpin(0.4, 0.1);
    cam.reset();
    expectClose(cam.pose().position, fresh);
  });
});
