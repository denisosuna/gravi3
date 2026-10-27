import { describe, expect, it } from 'vitest';
import { distanceRange, massRange, type Experiment } from '@/data/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { ARROW_LENGTH, forceLabLayout } from './force-lab-layout';

const experiment = (mass1: number, mass2: number, distance: number): Experiment => ({
  mass1,
  mass2,
  distance,
  prediction: null,
  checked: false,
});

function layoutOf(value: Experiment) {
  return forceLabLayout(value, gravitationalForce(value.mass1, value.mass2, value.distance));
}

describe('force laboratory layout', () => {
  it('keeps distance to scale: doubling the distance doubles the separation', () => {
    const near = layoutOf(experiment(200, 300, 4));
    const far = layoutOf(experiment(200, 300, 8));
    const separation = (layout: typeof near) => layout.positions[1] - layout.positions[0];
    expect(separation(far) / separation(near)).toBeCloseTo(2);
    expect(near.positions[0]).toBeCloseTo(-near.positions[1]);
  });

  it('never overlaps the bodies, even with the largest masses at the shortest distance', () => {
    const layout = layoutOf(experiment(massRange.max, massRange.max, distanceRange.min));
    const gap = layout.positions[1] - layout.positions[0] - layout.radii[0] - layout.radii[1];
    expect(gap).toBeGreaterThan(0);
  });

  it('draws the heavier body larger', () => {
    const layout = layoutOf(experiment(100, 800, 6));
    expect(layout.radii[1]).toBeGreaterThan(layout.radii[0]);
  });

  it('maps every possible force to a bounded arrow that grows with the force', () => {
    const weakest = layoutOf(experiment(massRange.min, massRange.min, distanceRange.max));
    const strongest = layoutOf(experiment(massRange.max, massRange.max, distanceRange.min));
    const middle = layoutOf(experiment(400, 400, 6));
    expect(weakest.arrowLength).toBeCloseTo(ARROW_LENGTH.min);
    expect(strongest.arrowLength).toBeCloseTo(ARROW_LENGTH.max);
    expect(middle.arrowLength).toBeGreaterThan(weakest.arrowLength);
    expect(middle.arrowLength).toBeLessThan(strongest.arrowLength);
  });
});
