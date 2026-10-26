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

// Standard step-size controller for a fifth-order method: h *= 0.9 * error^(-1/5), bounded.
const SAFETY_FACTOR = 0.9;
const MIN_STEP_SCALE = 0.1;
const MAX_STEP_SCALE = 5;
const ERROR_EXPONENT = -1 / 5;
const MIN_ERROR = 1e-15;
const INITIAL_STEP = 0.001;

interface IntegrationOptions {
  tolerance?: number;
  maxSteps?: number;
  maxStep?: number;
  gravitationalConstant?: number;
}

function dormandPrinceStep(
  state: number[],
  step: number,
  slopeAt: (stage: number[]) => number[],
): { next: number[]; lower: number[] } {
  const slopes: number[][] = [];
  const advance = (weights: readonly number[]) =>
    state.map(
      (value, i) =>
        value + step * weights.reduce((sum, weight, j) => sum + weight * slopes[j]![i]!, 0),
    );
  for (const coefficients of STAGES) slopes.push(slopeAt(advance(coefficients)));
  return { next: advance(HIGH), lower: advance(LOW) };
}

function scaledError(next: number[], lower: number[], state: number[], tolerance: number): number {
  return Math.max(
    ...next.map(
      (value, i) =>
        Math.abs(value - lower[i]!) /
        (tolerance * (1 + Math.max(Math.abs(value), Math.abs(state[i]!)))),
    ),
  );
}

function nextStepScale(error: number): number {
  const proposed = SAFETY_FACTOR * Math.max(error, MIN_ERROR) ** ERROR_EXPONENT;
  return Math.min(MAX_STEP_SCALE, Math.max(MIN_STEP_SCALE, proposed));
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
  const slopeAt = (stage: number[]) => derivatives(stage, masses, gravitationalConstant);
  let state = [...initialState];
  let time = 0;
  let step = Math.min(maxStep, INITIAL_STEP);
  const samples: Sample[] = [{ time, state }];
  for (let attempt = 0; time < duration; attempt++) {
    if (attempt >= maxSteps) throw new RangeError('Integration step budget exceeded.');
    step = Math.min(step, maxStep, duration - time);
    if (time + step === time) throw new RangeError('Integration step underflow.');
    const { next, lower } = dormandPrinceStep(state, step, slopeAt);
    const error = scaledError(next, lower, state, tolerance);
    if (!Number.isFinite(error)) throw new RangeError('Non-finite integration state.');
    if (error <= 1) {
      time += step;
      state = next;
      samples.push({ time, state });
    }
    step *= nextStepScale(error);
  }
  return samples;
}
