export interface TwoBodyState {
  position1: number;
  position2: number;
  velocity1: number;
  velocity2: number;
  distance: number;
  time: number;
}

const MAX_STEP = 1e-3;
const MAX_STEPS_PER_ADVANCE = 4000;
const COLLISION_DISTANCE = 0.03;

// One-dimensional Newtonian fall with initial separation, G, and total mass normalized to 1.
function acceleration(position1: number, position2: number, mass1: number, mass2: number) {
  const delta = position2 - position1;
  const distanceSquared = delta * delta;
  const scale = 1 / (distanceSquared * Math.sqrt(distanceSquared));
  return [mass2 * delta * scale, -mass1 * delta * scale] as const;
}

export class TwoBodySimulation {
  private position1: number;
  private position2: number;
  private velocity1 = 0;
  private velocity2 = 0;
  private elapsed = 0;
  private stopped = false;
  private readonly mass1: number;
  private readonly mass2: number;

  constructor(
    masses: readonly [number, number],
    readonly collisionDistance = COLLISION_DISTANCE,
  ) {
    if (!masses.every((mass) => Number.isFinite(mass) && mass > 0)) {
      throw new RangeError('Body masses must be positive and finite.');
    }
    if (!Number.isFinite(collisionDistance) || collisionDistance <= 0 || collisionDistance >= 1) {
      throw new RangeError('Collision distance must be finite and between zero and one.');
    }
    const totalMass = masses[0] + masses[1];
    this.mass1 = masses[0] / totalMass;
    this.mass2 = masses[1] / totalMass;
    this.position1 = -this.mass2;
    this.position2 = this.mass1;
  }

  get state(): TwoBodyState {
    return {
      position1: this.position1,
      position2: this.position2,
      velocity1: this.velocity1,
      velocity2: this.velocity2,
      distance: this.position2 - this.position1,
      time: this.elapsed,
    };
  }

  get halted(): boolean {
    return this.stopped;
  }

  advance(duration: number): void {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError('Simulation duration must be finite and nonnegative.');
    }
    if (this.stopped || duration === 0) return;

    let remaining = duration;
    let steps = 0;
    while (remaining > 0 && steps < MAX_STEPS_PER_ADVANCE) {
      const currentDistance = this.position2 - this.position1;
      if (currentDistance <= this.collisionDistance) {
        this.stopped = true;
        return;
      }

      const step = Math.min(MAX_STEP, 0.02 * currentDistance ** 1.5, remaining);
      const [a1, a2] = acceleration(this.position1, this.position2, this.mass1, this.mass2);
      const halfVelocity1 = this.velocity1 + (a1 * step) / 2;
      const halfVelocity2 = this.velocity2 + (a2 * step) / 2;
      const nextPosition1 = this.position1 + halfVelocity1 * step;
      const nextPosition2 = this.position2 + halfVelocity2 * step;
      const [nextA1, nextA2] = acceleration(nextPosition1, nextPosition2, this.mass1, this.mass2);
      const nextVelocity1 = halfVelocity1 + (nextA1 * step) / 2;
      const nextVelocity2 = halfVelocity2 + (nextA2 * step) / 2;
      const nextDistance = nextPosition2 - nextPosition1;

      if (nextDistance <= this.collisionDistance) {
        const fraction =
          (currentDistance - this.collisionDistance) / (currentDistance - nextDistance);
        this.position1 += (nextPosition1 - this.position1) * fraction;
        this.position2 += (nextPosition2 - this.position2) * fraction;
        this.velocity1 += (nextVelocity1 - this.velocity1) * fraction;
        this.velocity2 += (nextVelocity2 - this.velocity2) * fraction;
        this.elapsed += step * fraction;
        this.stopped = true;
        return;
      }

      this.position1 = nextPosition1;
      this.position2 = nextPosition2;
      this.velocity1 = nextVelocity1;
      this.velocity2 = nextVelocity2;
      this.elapsed += step;
      remaining -= step;
      steps++;
    }

    if (remaining > Number.EPSILON) {
      throw new RangeError('Simulation step budget exceeded.');
    }
  }
}
