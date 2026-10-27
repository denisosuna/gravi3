import { toCenterOfMassFrame } from '@/physics/simulation';
import type { Masses, OrbitSlug, State } from '@/physics/types';
import { findOrbit } from '@/physics/orbit-catalog';

export const SIMULATOR_PRESETS = [
  'figure-eight',
  'lagrange',
  'pythagorean',
  'sun-planet-moon',
] as const;
export type SimulatorPresetId = (typeof SIMULATOR_PRESETS)[number];

export interface SimulatorSetup {
  masses: Masses;
  initialState: State;
}

// Editing limits for the sandbox controls (normalized units, G = 1).
export const MASS_RANGE = { min: 0.0001, max: 6 } as const;
export const VELOCITY_RANGE = { min: -3, max: 3, step: 0.01 } as const;
// Relative velocity change applied by the "perturb" action to show sensitivity to initial conditions.
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
