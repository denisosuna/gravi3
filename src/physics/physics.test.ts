import { describe, expect, it } from 'vitest';
import { derivatives, gravitationalForce, invariants, UnresolvedEncounterError } from './gravity';
import { integrate, integrateAdaptive, StepBudgetError } from './integrator';
import { samplePositions } from './interpolation';

export function lagrangeInitialState() {
  const omega = 3 ** -0.25;
  const height = Math.sqrt(3) / 2;
  return {
    omega,
    state: [
      1,
      0,
      -0.5,
      height,
      -0.5,
      -height,
      0,
      omega,
      -height * omega,
      -0.5 * omega,
      height * omega,
      -0.5 * omega,
    ],
  };
}

describe('Newtonian gravity', () => {
  it('scales with each mass and with inverse squared center distance', () => {
    const base = gravitationalForce(100, 200, 10);
    expect(gravitationalForce(200, 200, 10) / base).toBeCloseTo(2);
    expect(gravitationalForce(100, 400, 10) / base).toBeCloseTo(2);
    expect(gravitationalForce(100, 200, 20) / base).toBeCloseTo(0.25);
  });
  it.each([0, -1, NaN, Infinity])('rejects invalid mass or distance %s', (value) => {
    expect(() => gravitationalForce(value, 1, 1)).toThrow(RangeError);
    expect(() => gravitationalForce(1, 1, value)).toThrow(RangeError);
  });
  it('conserves net force while acceleration depends on mass', () => {
    const d = derivatives([-1, 0, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0], [1, 2, 3]);
    expect(d[6]! + 2 * d[8]! + 3 * d[10]!).toBeCloseTo(0, 14);
    expect(d[7]! + 2 * d[9]! + 3 * d[11]!).toBeCloseTo(0, 14);
    expect(d[6]).not.toBe(d[8]);
  });
  it('does not conceal a collision with softening', () => {
    expect(() => derivatives(Array(12).fill(0), [1, 1, 1])).toThrow(UnresolvedEncounterError);
  });
});

describe('adaptive integration and playback', () => {
  it('resolves close encounters in the published Butterfly I seed with convergence', () => {
    // Li/Liao movie catalog, family I.A, initial condition 2; normalized G=m=1.
    const vx = 0.3068934205;
    const vy = 0.125506567;
    const state = [-1, 0, 1, 0, 0, 0, vx, vy, vx, vy, -2 * vx, -2 * vy];
    const loose = integrate(state, [1, 1, 1], 6.2346748391);
    const fine = integrate(state, [1, 1, 1], 6.2346748391, { tolerance: 1e-12 });
    state.forEach((value, i) => {
      expect(Math.abs(fine.at(-1)!.state[i]! - value)).toBeLessThan(1e-6);
      expect(Math.abs(fine.at(-1)!.state[i]! - loose.at(-1)!.state[i]!)).toBeLessThan(1e-7);
    });
  });
  it('reproduces the analytic equilateral circular solution and conserves energy', () => {
    const { state, omega } = lagrangeInitialState();
    const period = (2 * Math.PI) / omega;
    const samples = integrate(state, [1, 1, 1], period);
    const last = samples.at(-1)!;
    state.forEach((value, i) => expect(Math.abs(last.state[i]! - value)).toBeLessThan(1e-8));
    expect(
      Math.abs(invariants(last.state, [1, 1, 1]).energy - invariants(state, [1, 1, 1]).energy),
    ).toBeLessThan(1e-9);
    const result = samplePositions(
      { version: 1, slug: 'lagrange', period, samples },
      period / 4,
      [],
    );
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(1, 6);
  });
  it('fails explicitly when a step budget or input is invalid', () => {
    const { state } = lagrangeInitialState();
    expect(() => integrate(state, [1, 1, 1], 1, { maxSteps: 1 })).toThrow('budget');
    expect(() => integrate(state, [1, 1, 1], 1, { maxSteps: 1 })).toThrow(StepBudgetError);
    expect(() => integrate(state, [1, 1, 1], NaN)).toThrow(RangeError);
    expect(() => integrate([NaN], [1, 1, 1], 1)).toThrow(RangeError);
  });

  it('resumes from the last proposed step, reaching the same state with fewer attempts', () => {
    // Burrau's Pythagorean problem: close encounters make the step size swing widely.
    const masses = [3, 4, 5] as const;
    const start = [1, 3, -2, -1, 1, -1, 0, 0, 0, 0, 0, 0];
    const frame = 1 / 60;
    const run = (carry: boolean) => {
      let state = start;
      let step: number | undefined;
      let attempts = 0;
      for (let i = 0; i < 600; i++) {
        const result = integrateAdaptive(state, masses, frame, {
          tolerance: 1e-10,
          maxStep: frame,
          initialStep: carry ? step : undefined,
        });
        state = result.samples.at(-1)!.state as number[];
        step = result.nextStep;
        attempts += result.attempts;
      }
      return { state, attempts };
    };
    const fresh = run(false);
    const carried = run(true);
    carried.state.forEach((value, index) => expect(value).toBeCloseTo(fresh.state[index]!, 6));
    expect(carried.attempts).toBeLessThan(fresh.attempts);
  });
});
