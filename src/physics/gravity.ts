import type { Masses, State } from './types';

export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

export function gravitationalForce(mass1: number, mass2: number, distance: number): number {
  if (![mass1, mass2, distance].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Masses and center-to-center distance must be positive and finite.');
  }
  const force = (GRAVITATIONAL_CONSTANT * mass1 * mass2) / distance ** 2;
  if (!Number.isFinite(force)) throw new RangeError('Force exceeds numeric range.');
  return force;
}

export function validateSystem(state: State, masses: Masses, constant: number) {
  if (state.length !== 12 || !state.every(Number.isFinite)) {
    throw new RangeError('Expected twelve finite state components.');
  }
  if (![...masses, constant].every((value) => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Masses and gravitational constant must be positive and finite.');
  }
}

export function derivatives(state: State, masses: Masses, constant = 1): number[] {
  const result = [...state.slice(6), 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dx = state[2 * j]! - state[2 * i]!;
      const dy = state[2 * j + 1]! - state[2 * i + 1]!;
      const squaredDistance = dx * dx + dy * dy;
      if (squaredDistance < 1e-16) throw new RangeError('Collision or unresolved close encounter.');
      const scale = constant / (squaredDistance * Math.sqrt(squaredDistance));
      result[6 + 2 * i]! += masses[j]! * dx * scale;
      result[7 + 2 * i]! += masses[j]! * dy * scale;
      result[6 + 2 * j]! -= masses[i]! * dx * scale;
      result[7 + 2 * j]! -= masses[i]! * dy * scale;
    }
  }
  return result;
}

export function invariants(state: State, masses: Masses, constant = 1) {
  let energy = 0;
  let angularMomentum = 0;
  let momentumX = 0;
  let momentumY = 0;
  let centerX = 0;
  let centerY = 0;
  let minimumDistance = Infinity;
  const totalMass = masses.reduce((sum, mass) => sum + mass, 0);
  for (let i = 0; i < 3; i++) {
    const [x, y, vx, vy] = [state[2 * i]!, state[2 * i + 1]!, state[6 + 2 * i]!, state[7 + 2 * i]!];
    energy += (masses[i]! * (vx * vx + vy * vy)) / 2;
    angularMomentum += masses[i]! * (x * vy - y * vx);
    momentumX += masses[i]! * vx;
    momentumY += masses[i]! * vy;
    centerX += (masses[i]! * x) / totalMass;
    centerY += (masses[i]! * y) / totalMass;
    for (let j = i + 1; j < 3; j++) {
      const distance = Math.hypot(state[2 * j]! - x, state[2 * j + 1]! - y);
      minimumDistance = Math.min(minimumDistance, distance);
      energy -= (constant * masses[i]! * masses[j]!) / distance;
    }
  }
  return { energy, angularMomentum, momentumX, momentumY, centerX, centerY, minimumDistance };
}
