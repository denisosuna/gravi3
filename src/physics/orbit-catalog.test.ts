import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { samplePositions } from '@/physics/interpolation';
import { parseTrajectory } from '@/physics/trajectory-schema';
import { ASSETS } from '@/shared/constants/routes';
import { ORBIT_CATALOG, orbitFor, orbits } from './orbit-catalog';

const SEARCH_HALF_WIDTH = 0.002;
const SEARCH_STEPS = 400;
const SCAN_STEPS = 20_000;
const RELATIVE_TOLERANCE = 0.05;

function closestSeparation(
  slug: (typeof orbits)[number]['slug'],
  from: number,
  to: number,
  steps: number,
) {
  const orbit = orbitFor(slug);
  const json: unknown = JSON.parse(
    readFileSync(new URL(`../../public${ASSETS.orbitTrajectory(slug)}`, import.meta.url), 'utf8'),
  );
  const trajectory = parseTrajectory(json, orbit);
  const positions = Array<number>(6).fill(0);
  let closest = Infinity;
  for (let step = 0; step <= steps; step++) {
    const fraction = from + ((to - from) * step) / steps;
    samplePositions(trajectory, (((fraction % 1) + 1) % 1) * trajectory.period, positions);
    const distance = (a: number, b: number) =>
      Math.hypot(
        positions[2 * a]! - positions[2 * b]!,
        positions[2 * a + 1]! - positions[2 * b + 1]!,
      );
    closest = Math.min(closest, distance(0, 1), distance(0, 2), distance(1, 2));
  }
  return closest;
}

// The tutor and the descriptions quote these values, so they must match the validated data.
describe('closest approaches in the catalogue', () => {
  for (const orbit of orbits) {
    const approach = ORBIT_CATALOG[orbit.slug].closestApproach;
    if (!approach) continue;
    it(`${orbit.slug}: the recorded moment and distance match the trajectory`, () => {
      const local = closestSeparation(
        orbit.slug,
        approach.fraction - SEARCH_HALF_WIDTH,
        approach.fraction + SEARCH_HALF_WIDTH,
        SEARCH_STEPS,
      );
      const global = closestSeparation(orbit.slug, 0, 1, SCAN_STEPS);
      expect(Math.abs(local - approach.distance) / approach.distance).toBeLessThan(
        RELATIVE_TOLERANCE,
      );
      expect(local).toBeLessThanOrEqual(global * (1 + RELATIVE_TOLERANCE));
    });
  }
});
