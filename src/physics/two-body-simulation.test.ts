import { describe, expect, it } from 'vitest';
import { TwoBodySimulation } from './two-body-simulation';

describe('two-body gravitational fall', () => {
  it('starts from rest and increases the bodies’ separation speed toward each other', () => {
    const simulation = new TwoBodySimulation([1, 3]);
    const initial = simulation.state;

    expect(initial.velocity1).toBe(0);
    expect(initial.velocity2).toBe(0);
    expect(initial.distance).toBe(1);

    simulation.advance(0.1);

    expect(simulation.state.distance).toBeLessThan(1);
    expect(simulation.state.velocity1).toBeGreaterThan(0);
    expect(simulation.state.velocity2).toBeLessThan(0);
  });

  it('conserves the center of mass and moves the lighter body farther', () => {
    const simulation = new TwoBodySimulation([1, 3]);
    const initial = simulation.state;

    simulation.advance(0.1);
    const current = simulation.state;

    expect((initial.position1 + initial.position2 * 3) / 4).toBeCloseTo(
      (current.position1 + current.position2 * 3) / 4,
      12,
    );
    expect(Math.abs(current.position1 - initial.position1)).toBeGreaterThan(
      Math.abs(current.position2 - initial.position2),
    );
  });

  it('stops at a close encounter instead of integrating through the point-mass singularity', () => {
    const simulation = new TwoBodySimulation([1, 1]);
    for (let frame = 0; frame < 300 && !simulation.halted; frame++) {
      simulation.advance(0.01);
    }

    expect(simulation.halted).toBe(true);
    expect(simulation.state.distance).toBeCloseTo(simulation.collisionDistance, 5);
    expect(simulation.state.time).toBeCloseTo(1.1082, 3);
  });

  it('can stop at a larger visual-contact distance before the point-mass cutoff', () => {
    const simulation = new TwoBodySimulation([1, 1], 0.2);
    for (let frame = 0; frame < 300 && !simulation.halted; frame++) {
      simulation.advance(0.01);
    }

    expect(simulation.state.distance).toBeCloseTo(0.2, 5);
  });
});
