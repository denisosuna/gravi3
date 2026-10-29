import { toCenterOfMassFrame } from '@/physics/simulation';
import {
  BODY_INDICES,
  VELOCITY_OFFSET,
  type Masses,
  type OrbitSlug,
  type State,
} from '@/physics/types';
import { findOrbit } from '@/physics/orbit-catalog';

export const SIMULATOR_PRESETS = [
  'figure-eight',
  'lagrange',
  'pythagorean',
  'sun-planet-moon',
] as const;
export type SimulatorPresetId = (typeof SIMULATOR_PRESETS)[number];
// Shown once the learner edits a body, so no starting point matches any more.
export const CUSTOM_PRESET = 'custom';
export type SimulatorPresetSelection = SimulatorPresetId | typeof CUSTOM_PRESET;

export interface SimulatorSetup {
  masses: Masses;
  initialState: State;
}

// Editing limits for the sandbox controls (normalized units, G = 1).
export const MASS_RANGE = { min: 0.0001, max: 6 } as const;
export const VELOCITY_RANGE = { min: -3, max: 3, step: 0.01 } as const;
// How far the tutor may scale one body's starting velocity in a "what if" experiment.
export const VELOCITY_FACTOR_RANGE = { min: 0.5, max: 2 } as const;
// Relative change applied by the "perturb" action to show sensitivity to initial conditions.
export const PERTURBATION = 0.01;

function fromCatalog(slug: OrbitSlug): SimulatorSetup {
  const orbit = findOrbit(slug);
  if (!orbit) throw new RangeError(`Unknown orbit: ${slug}`);
  return { masses: orbit.masses, initialState: orbit.initialState };
}

// Burrau's problem (1913): masses 3, 4 and 5 start at rest on a 3-4-5 triangle; one is ejected.
const PYTHAGOREAN: SimulatorSetup = {
  masses: [3, 4, 5],
  initialState: [1, 3, -2, -1, 1, -1, 0, 0, 0, 0, 0, 0],
};

// A hierarchical, nearly regular system: a moon orbits a planet that orbits a star.
const SUN_PLANET_MOON_MASSES: Masses = [1, 0.01, 0.0001];
const SUN_PLANET_MOON: SimulatorSetup = {
  masses: SUN_PLANET_MOON_MASSES,
  initialState: toCenterOfMassFrame(SUN_PLANET_MOON_MASSES, [
    0,
    0,
    1,
    0,
    1.05,
    0,
    0,
    0,
    0,
    1,
    0,
    1 + Math.sqrt(0.01 / 0.05),
  ]),
};

export function simulatorPreset(id: SimulatorPresetId): SimulatorSetup {
  switch (id) {
    case 'figure-eight':
    case 'lagrange':
      return fromCatalog(id);
    case 'pythagorean':
      return PYTHAGOREAN;
    case 'sun-planet-moon':
      return SUN_PLANET_MOON;
  }
}

// Scales the first moving body's velocity by 1%. A system that starts at rest (Pythagorean) has no
// velocity to scale, so body 1's position moves by 1% instead: either way the start changes slightly.
export function perturbedState(state: State): State {
  const next = [...state];
  const moving = BODY_INDICES.find(
    (body) =>
      state[VELOCITY_OFFSET + 2 * body] !== 0 || state[VELOCITY_OFFSET + 2 * body + 1] !== 0,
  );
  const offset = moving === undefined ? 0 : VELOCITY_OFFSET + 2 * moving;
  next[offset] = next[offset]! * (1 + PERTURBATION);
  next[offset + 1] = next[offset + 1]! * (1 + PERTURBATION);
  return next;
}
