import { distanceRange, massRange, type Experiment } from '@/features/learning/model/experiment';
import { gravitationalForce } from '@/physics/gravity';

// Distance is drawn to scale: the largest distance spans this many world units from the center.
const HALF_SPAN = 2.6;
// Horizontal room the camera must show: the largest separation plus space for labels.
export const VISIBLE_HALF_WIDTH = HALF_SPAN + 0.7;
// Radius grows with the cube root of mass (constant density).
const RADIUS_PER_CUBE_ROOT_KG = 0.05;
// Both bodies together may fill at most this share of the separation, so they never touch.
const MAX_SEPARATION_FILL = 0.8;
export const ARROW_LENGTH = { min: 0.25, max: 1.6 } as const;

const WEAKEST_FORCE = gravitationalForce(massRange.min, massRange.min, distanceRange.max);
const STRONGEST_FORCE = gravitationalForce(massRange.max, massRange.max, distanceRange.min);

interface ForceLabLayout {
  positions: readonly [number, number];
  radii: readonly [number, number];
  arrowLength: number;
}

// Forces span four orders of magnitude, so arrow length follows a logarithmic scale.
function arrowLength(force: number): number {
  const fraction = Math.log(force / WEAKEST_FORCE) / Math.log(STRONGEST_FORCE / WEAKEST_FORCE);
  const clamped = Math.min(1, Math.max(0, fraction));
  return ARROW_LENGTH.min + clamped * (ARROW_LENGTH.max - ARROW_LENGTH.min);
}

export function forceLabLayout(experiment: Experiment, force: number): ForceLabLayout {
  const offset = (experiment.distance / distanceRange.max) * HALF_SPAN;
  const radii = [experiment.mass1, experiment.mass2].map(
    (mass) => RADIUS_PER_CUBE_ROOT_KG * Math.cbrt(mass),
  ) as [number, number];
  const shrink = Math.min(1, (MAX_SEPARATION_FILL * 2 * offset) / (radii[0] + radii[1]));
  return {
    positions: [-offset, offset],
    radii: [radii[0] * shrink, radii[1] * shrink],
    arrowLength: arrowLength(force),
  };
}
