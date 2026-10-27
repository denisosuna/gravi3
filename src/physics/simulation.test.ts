import { describe, expect, it } from 'vitest';
import { findOrbit } from '@/physics/orbit-catalog';
import { invariants } from './gravity';
import { ThreeBodySimulation, toCenterOfMassFrame } from './simulation';
import type { Masses, State } from './types';

const EQUAL_MASSES: Masses = [1, 1, 1];

function advanceInFrames(simulation: ThreeBodySimulation, duration: number, frame = 1 / 60) {
  const events = [];
  for (let elapsed = 0; elapsed < duration; elapsed += frame) {
    const event = simulation.advance(Math.min(frame, duration - elapsed));
    if (event) events.push(event);
  }
  return events;
}

describe('live three-body simulation', () => {
  it('returns the figure eight to its start after one period while conserving energy', () => {
    const orbit = findOrbit('figure-eight')!;
    const simulation = new ThreeBodySimulation(orbit.masses, orbit.initialState);
    expect(advanceInFrames(simulation, orbit.period)).toEqual([]);
    simulation.state.forEach((value, index) =>
      expect(value).toBeCloseTo(orbit.initialState[index]!, 4),
    );
    expect(Math.abs(simulation.diagnostics().energyDrift)).toBeLessThan(1e-7);
    expect(simulation.time).toBeCloseTo(orbit.period);
  });

  it('stops with a collision event instead of producing non-finite values', () => {
    // Two bodies are inside the configured collision distance; the third is far away.
    const closePair: State = [-0.00025, 0, 0.00025, 0, 0, 30, 0, 0, 0, 0, 0, 0];
    const simulation = new ThreeBodySimulation(EQUAL_MASSES, closePair);
    expect(simulation.advance(1 / 60)).toBe('collision');
    expect(simulation.halted).toBe(true);
    expect(simulation.state.every(Number.isFinite)).toBe(true);
    const frozen = [...simulation.state];
    expect(simulation.advance(1)).toBe('collision');
    expect(simulation.state).toEqual(frozen);
  });

  it('reports an unresolved trial-stage encounter separately from a confirmed collision', () => {
    const nearPass: State = [-100, 0, 100, 0, 10_000, 30_000, 100_000, 0, -100_000, 0, 0, 0];
    const simulation = new ThreeBodySimulation(EQUAL_MASSES, nearPass);

    expect(simulation.advance(0.001)).toBe('closeEncounter');
    expect(simulation.halted).toBe(true);
    expect(simulation.time).toBe(0);
    expect(simulation.state.every(Number.isFinite)).toBe(true);
  });

  it('reports an unresolved head-on path as a close encounter, not a confirmed collision', () => {
    const headOn: State = [-0.5, 0, 0.5, 0, 0, 30, 0, 0, 0, 0, 0, 0];
    const simulation = new ThreeBodySimulation(EQUAL_MASSES, headOn);

    expect(advanceInFrames(simulation, 5)).toContain('closeEncounter');
    expect(simulation.halted).toBe(true);
    expect(simulation.state.every(Number.isFinite)).toBe(true);
  });

  it('reports once when a body escapes far from the center of mass', () => {
    const runaway: State = [-1, 0, 1, 0, 0, 0, 0, 0.5, 0, -0.5, 6, 0];
    const simulation = new ThreeBodySimulation(EQUAL_MASSES, runaway);
    const events = advanceInFrames(simulation, 4);
    expect(events).toEqual(['escape']);
    expect(simulation.halted).toBe(false);
  });

  it('describes the system with energy drift, center of mass and closest separation', () => {
    const symmetric: State = [-1, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0];
    const diagnostics = new ThreeBodySimulation(EQUAL_MASSES, symmetric).diagnostics();
    expect(diagnostics.energyDrift).toBe(0);
    expect(diagnostics.centerOfMass[0]).toBeCloseTo(0);
    expect(diagnostics.centerOfMass[1]).toBeCloseTo(2 / 3);
    expect(diagnostics.minimumSeparation).toBeCloseTo(2);
  });

  it('rejects invalid systems up front', () => {
    expect(() => new ThreeBodySimulation([1, -1, 1], Array(12).fill(0))).toThrow(RangeError);
    expect(() => new ThreeBodySimulation(EQUAL_MASSES, [0, 0])).toThrow(RangeError);
  });
});

describe('center-of-mass frame', () => {
  it('removes net momentum and centers the system without changing relative motion', () => {
    const masses: Masses = [1, 0.01, 0.0001];
    const state: State = [0, 0, 1, 0, 1.05, 0, 0, 0, 0, 1, 0, 1.45];
    const centered = toCenterOfMassFrame(masses, state);
    const { momentumX, momentumY, centerX, centerY } = invariants(centered, masses);
    expect(Math.hypot(momentumX, momentumY)).toBeLessThan(1e-12);
    expect(Math.hypot(centerX, centerY)).toBeLessThan(1e-12);
    expect(centered[2]! - centered[0]!).toBeCloseTo(state[2]! - state[0]!);
    expect(centered[9]! - centered[7]!).toBeCloseTo(state[9]! - state[7]!);
  });
});
