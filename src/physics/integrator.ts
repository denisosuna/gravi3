import { derivatives, validateSystem } from './gravity';
import type { Masses, Sample, State } from './types';

// Dormand–Prince 5(4) Butcher tableau; embedded fourth order estimates local error.
const STAGES = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
] as const;
const HIGH = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const LOW = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];

interface IntegrationOptions {
  tolerance?: number;
  maxSteps?: number;
  maxStep?: number;
  gravitationalConstant?: number;
}

export function integrate(
  initialState: State,
  masses: Masses,
  duration: number,
  {
    tolerance = 1e-11,
    maxSteps = 200_000,
    maxStep = duration / 128,
    gravitationalConstant = 1,
  }: IntegrationOptions = {},
): Sample[] {
  validateSystem(initialState, masses, gravitationalConstant);
  if (
    ![duration, tolerance, maxStep, maxSteps].every((value) => Number.isFinite(value) && value > 0)
  ) {
    throw new RangeError('Integration duration, tolerance and limits must be positive and finite.');
  }
  let state = [...initialState];
  let time = 0;
  let step = Math.min(maxStep, 0.001);
  const samples: Sample[] = [{ time, state }];
  for (let attempt = 0; time < duration; attempt++) {
    if (attempt >= maxSteps) throw new RangeError('Integration step budget exceeded.');
    step = Math.min(step, maxStep, duration - time);
    if (time + step === time) throw new RangeError('Integration step underflow.');
    const slopes: number[][] = [];
    for (const coefficients of STAGES) {
      const stage = state.map(
        (value, i) =>
          value +
          step *
            coefficients.reduce(
              (sum: number, coefficient, j) => sum + coefficient * slopes[j]![i]!,
              0,
            ),
      );
      slopes.push(derivatives(stage, masses, gravitationalConstant));
    }
    const combine = (weights: number[]) =>
      state.map(
        (value, i) =>
          value + step * weights.reduce((sum, weight, j) => sum + weight * slopes[j]![i]!, 0),
      );
    const next = combine(HIGH);
    const lower = combine(LOW);
    const error = Math.max(
      ...next.map(
        (value, i) =>
          Math.abs(value - lower[i]!) /
          (tolerance * (1 + Math.max(Math.abs(value), Math.abs(state[i]!)))),
      ),
    );
    if (!Number.isFinite(error)) throw new RangeError('Non-finite integration state.');
    if (error <= 1) {
      time += step;
      state = next;
      samples.push({ time, state });
    }
    step *= Math.min(5, Math.max(0.1, 0.9 * Math.max(error, 1e-15) ** -0.2));
  }
  return samples;
}
