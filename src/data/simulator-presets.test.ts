import { describe, expect, it } from 'vitest';
import { invariants } from '@/physics/gravity';
import { ThreeBodySimulation, toCenterOfMassFrame } from '@/physics/simulation';
import { findOrbit } from './orbits';
import { simulatorPreset, type SimulatorPresetId } from './simulator-presets';

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
