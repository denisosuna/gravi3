import { describe, expect, it } from 'vitest';
import { invariants } from '@/physics/gravity';
import { ThreeBodySimulation, toCenterOfMassFrame } from '@/physics/simulation';
import { findOrbit } from '@/physics/orbit-catalog';
import { VELOCITY_OFFSET } from '@/physics/types';
import {
  PERTURBATION,
  perturbedState,
  simulatorPreset,
  type SimulatorPresetId,
} from './simulator-presets';

const FRAME = 1 / 60;

function run(id: SimulatorPresetId, duration: number) {
  const { masses, initialState } = simulatorPreset(id);
  const simulation = new ThreeBodySimulation(masses, toCenterOfMassFrame(masses, initialState));
  const events = [];
  let closest = Infinity;
  for (let elapsed = 0; elapsed < duration; elapsed += FRAME) {
    const event = simulation.advance(FRAME);
    if (event) events.push(event);
    closest = Math.min(closest, invariants(simulation.state, masses).minimumDistance);
  }
  return { events, closest };
}

// The preset hints and tutor prompt describe these behaviors; keep them true.
describe('simulator presets behave as the interface describes', () => {
  it('Pythagorean: chaotic encounters end with one body ejected, not a collision', () => {
    const { events } = run('pythagorean', 70);
    expect(events).toEqual(['escape']);
  });

  it('Lagrange: keeps its equilateral triangle for the first periods', () => {
    const period = findOrbit('lagrange')!.period;
    const { closest } = run('lagrange', 3 * period);
    expect(closest).toBeCloseTo(Math.sqrt(3), 3);
  });
});

describe('the 1% perturbation', () => {
  it('changes every preset, including the Pythagorean one that starts at rest', () => {
    for (const id of ['figure-eight', 'lagrange', 'pythagorean', 'sun-planet-moon'] as const) {
      const { initialState } = simulatorPreset(id);
      expect(perturbedState(initialState)).not.toEqual(initialState);
    }
    const pythagorean = simulatorPreset('pythagorean').initialState;
    expect(perturbedState(pythagorean)[0]).toBeCloseTo(pythagorean[0]! * (1 + PERTURBATION));
    const eight = simulatorPreset('figure-eight').initialState;
    expect(perturbedState(eight)[VELOCITY_OFFSET]).toBeCloseTo(
      eight[VELOCITY_OFFSET]! * (1 + PERTURBATION),
    );
  });
});
