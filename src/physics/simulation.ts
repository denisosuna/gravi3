import { invariants, UnresolvedEncounterError, validateSystem } from './gravity';
import { integrateAdaptive, StepBudgetError } from './integrator';
import { BODY_INDICES, bodyPosition, VELOCITY_OFFSET, type Masses, type State } from './types';

// A close encounter is one too tight to resolve within the per-frame step budget.
export type SimulationEvent = 'collision' | 'closeEncounter' | 'escape';
export type HaltingEvent = Exclude<SimulationEvent, 'escape'>;

// Point masses closer than this are treated as a collision: the force grows without bound.
export const COLLISION_DISTANCE = 1e-3;
// A body this far from the center of mass has left the interaction region.
export const ESCAPE_DISTANCE = 12;
const TOLERANCE = 1e-10;
// Bounds the work per frame so a very close encounter cannot freeze the page.
const MAX_STEPS_PER_ADVANCE = 4000;

export interface SimulationDiagnostics {
  energy: number;
  // Relative change of total energy since the start; ideally zero.
  energyDrift: number;
  centerOfMass: readonly [number, number];
  minimumSeparation: number;
}

// Shifts positions and velocities so the center of mass sits at rest at the origin.
export function toCenterOfMassFrame(masses: Masses, state: State): State {
  const totalMass = masses.reduce((sum, mass) => sum + mass, 0);
  const offset = [0, 0, 0, 0];
  for (const body of BODY_INDICES) {
    const weight = masses[body]! / totalMass;
    offset[0]! += weight * state[2 * body]!;
    offset[1]! += weight * state[2 * body + 1]!;
    offset[2]! += weight * state[VELOCITY_OFFSET + 2 * body]!;
    offset[3]! += weight * state[VELOCITY_OFFSET + 2 * body + 1]!;
  }
  return state.map((value, index) => {
    const isVelocity = index >= VELOCITY_OFFSET;
    return value - offset[(isVelocity ? 2 : 0) + (index % 2)]!;
  });
}

// Live, exact Newtonian integration (G = 1, no softening) for the interactive sandbox.
export class ThreeBodySimulation {
  private current: number[];
  private elapsed = 0;
  private haltedBy: HaltingEvent | undefined;
  // Last step size the integrator proposed, reused by the next frame.
  private step: number | undefined;
  private escapeReported = false;
  private readonly initialEnergy: number;

  constructor(
    readonly masses: Masses,
    initialState: State,
  ) {
    validateSystem(initialState, masses, 1);
    this.current = [...initialState];
    this.initialEnergy = invariants(initialState, masses).energy;
  }

  get state(): State {
    return this.current;
  }

  get time(): number {
    return this.elapsed;
  }

  get halted(): boolean {
    return this.haltedBy !== undefined;
  }

  advance(duration: number): SimulationEvent | undefined {
    if (this.haltedBy) return this.haltedBy;
    if (duration <= 0) return undefined;
    if (invariants(this.current, this.masses).minimumDistance < COLLISION_DISTANCE)
      return this.halt('collision');
    try {
      const { samples, nextStep } = integrateAdaptive(this.current, this.masses, duration, {
        tolerance: TOLERANCE,
        maxSteps: MAX_STEPS_PER_ADVANCE,
        maxStep: duration,
        initialStep: this.step,
      });
      const next = samples.at(-1)!.state;
      if (invariants(next, this.masses).minimumDistance < COLLISION_DISTANCE)
        return this.halt('collision');
      this.current = [...next];
      this.elapsed += duration;
      this.step = nextStep;
    } catch (error) {
      if (error instanceof StepBudgetError || error instanceof UnresolvedEncounterError)
        return this.halt('closeEncounter');
      throw error;
    }
    return this.checkEscape();
  }

  diagnostics(): SimulationDiagnostics {
    const { energy, centerX, centerY, minimumDistance } = invariants(this.current, this.masses);
    return {
      energy,
      energyDrift: (energy - this.initialEnergy) / Math.abs(this.initialEnergy),
      centerOfMass: [centerX, centerY],
      minimumSeparation: minimumDistance,
    };
  }

  private halt(event: HaltingEvent): HaltingEvent {
    this.haltedBy = event;
    return event;
  }

  private checkEscape(): SimulationEvent | undefined {
    if (this.escapeReported) return undefined;
    const [centerX, centerY] = this.diagnostics().centerOfMass;
    const escaped = BODY_INDICES.some((body) => {
      const [x, y] = bodyPosition(this.current, body);
      return Math.hypot(x - centerX, y - centerY) > ESCAPE_DISTANCE;
    });
    if (!escaped) return undefined;
    this.escapeReported = true;
    return 'escape';
  }
}
