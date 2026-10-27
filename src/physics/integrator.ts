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
  // A step size proposed by a previous call, so consecutive calls do not restart small.
  initialStep?: number;
}

interface AdaptiveIntegration {
  samples: Sample[];
  // The step size the controller would try next; pass it back as `initialStep`.
  nextStep: number;
  attempts: number;
}

// Thrown when a very close encounter needs more steps than allowed; not a collision by itself.
export class StepBudgetError extends RangeError {
  constructor() {
    super('Integration step budget exceeded.');
  }
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

function assertPositive(values: readonly number[]) {
  if (!values.every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Integration duration, tolerance and limits must be positive and finite.');
  }
}

// A step shortened only to land on the end time says nothing new about the right size.
function nextProposal(step: number, proposal: number, error: number, maxStep: number): number {
  const scaled = step * nextStepScale(error);
  const shortenedButAccepted = error <= 1 && step < proposal;
  return Math.min(maxStep, shortenedButAccepted ? Math.max(proposal, scaled) : scaled);
}

export function integrateAdaptive(
  initialState: State,
  masses: Masses,
  duration: number,
  {
    tolerance = 1e-11,
    maxSteps = 200_000,
    maxStep = duration / 128,
    gravitationalConstant = 1,
    initialStep = INITIAL_STEP,
  }: IntegrationOptions = {},
): AdaptiveIntegration {
  validateSystem(initialState, masses, gravitationalConstant);
  assertPositive([duration, tolerance, maxStep, maxSteps, initialStep]);
  const slopeAt = (stage: number[]) => derivatives(stage, masses, gravitationalConstant);
  let state = [...initialState];
  let time = 0;
  let proposal = Math.min(maxStep, initialStep);
  const samples: Sample[] = [{ time, state }];
  let attempt = 0;
  for (; time < duration; attempt++) {
    if (attempt >= maxSteps) throw new StepBudgetError();
    const step = Math.min(proposal, duration - time);
    if (time + step === time) throw new RangeError('Integration step underflow.');
    const { next, lower } = dormandPrinceStep(state, step, slopeAt);
    const error = scaledError(next, lower, state, tolerance);
    if (!Number.isFinite(error)) throw new RangeError('Non-finite integration state.');
    if (error <= 1) {
      time += step;
      state = next;
      samples.push({ time, state });
    }
    proposal = nextProposal(step, proposal, error, maxStep);
  }
  return { samples, nextStep: proposal, attempts: attempt };
}

export function integrate(
  initialState: State,
  masses: Masses,
  duration: number,
  options: IntegrationOptions = {},
): Sample[] {
  return integrateAdaptive(initialState, masses, duration, options).samples;
}
