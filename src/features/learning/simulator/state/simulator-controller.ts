import {
  CUSTOM_PRESET,
  PERTURBATION,
  simulatorPreset,
  type SimulatorPresetId,
  type SimulatorPresetSelection,
  type SimulatorSetup,
} from '@/features/learning/model/simulator-presets';
import {
  ThreeBodySimulation,
  isHaltingEvent,
  toCenterOfMassFrame,
  type SimulationDiagnostics,
  type SimulationEvent,
} from '@/physics/simulation';
import { MAX_FRAME_DELTA_SECONDS } from '@/shared/constants/animation';
import { VELOCITY_OFFSET, type Masses } from '@/physics/types';

export const SIMULATOR_SPEEDS = [0.5, 1, 2] as const;
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3] as const;
const DEFAULT_ZOOM_INDEX = 2;
const DEFAULT_PRESET: SimulatorPresetId = 'figure-eight';

export interface BodyEdit {
  mass?: number;
  vx?: number;
  vy?: number;
}

export interface SimulatorSnapshot {
  presetId: SimulatorPresetSelection;
  setup: SimulatorSetup;
  playing: boolean;
  speed: (typeof SIMULATOR_SPEEDS)[number];
  zoomIndex: number;
  time: number;
  event?: SimulationEvent;
  diagnostics: SimulationDiagnostics;
  // Increments whenever the simulation restarts, so the scene can clear its trails.
  revision: number;
}

function createSimulation({ masses, initialState }: SimulatorSetup) {
  return new ThreeBodySimulation(masses, toCenterOfMassFrame(masses, initialState));
}

// Owns the live simulation; React reads throttled snapshots, the scene reads `simulation` per frame.
export class SimulatorController {
  simulation: ThreeBodySimulation;
  private value: SimulatorSnapshot;
  private listeners = new Set<() => void>();

  constructor() {
    const setup = simulatorPreset(DEFAULT_PRESET);
    this.simulation = createSimulation(setup);
    this.value = {
      presetId: DEFAULT_PRESET,
      setup,
      playing: false,
      speed: 1,
      zoomIndex: DEFAULT_ZOOM_INDEX,
      time: 0,
      diagnostics: this.simulation.diagnostics(),
      revision: 0,
    };
  }

  snapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  update(patch: Partial<Pick<SimulatorSnapshot, 'playing' | 'speed' | 'zoomIndex'>>) {
    this.emit(patch);
  }

  loadPreset(presetId: SimulatorPresetId) {
    this.restart(simulatorPreset(presetId), presetId);
  }

  reset() {
    this.restart(this.value.setup, this.value.presetId);
  }

  editBody(body: number, { mass, vx, vy }: BodyEdit) {
    const { masses, initialState } = this.value.setup;
    const massOf = (index: number) =>
      index === body && mass !== undefined ? mass : masses[index]!;
    const nextMasses: Masses = [massOf(0), massOf(1), massOf(2)];
    const nextState = [...initialState];
    if (vx !== undefined) nextState[VELOCITY_OFFSET + 2 * body] = vx;
    if (vy !== undefined) nextState[VELOCITY_OFFSET + 2 * body + 1] = vy;
    this.restart({ masses: nextMasses, initialState: nextState }, CUSTOM_PRESET);
  }

  perturb() {
    const nextState = [...this.value.setup.initialState];
    nextState[VELOCITY_OFFSET] = nextState[VELOCITY_OFFSET]! * (1 + PERTURBATION);
    this.restart({ ...this.value.setup, initialState: nextState }, CUSTOM_PRESET);
  }

  // Called every animation frame; does not notify React.
  step(delta: number) {
    if (!this.value.playing) return;
    const duration = Math.min(Math.max(0, delta), MAX_FRAME_DELTA_SECONDS) * this.value.speed;
    const event = this.simulation.advance(duration);
    if (isHaltingEvent(event)) this.emit({ playing: false, event });
    else if (event) this.emit({ event });
  }

  // Refreshes time and diagnostics for the readouts; called on a timer while playing.
  publish = () => this.emit({});

  private restart(setup: SimulatorSetup, presetId: SimulatorSnapshot['presetId']) {
    this.simulation = createSimulation(setup);
    this.emit({
      presetId,
      setup,
      playing: false,
      event: undefined,
      revision: this.value.revision + 1,
    });
  }

  private emit(patch: Partial<SimulatorSnapshot>) {
    this.value = {
      ...this.value,
      ...patch,
      time: this.simulation.time,
      diagnostics: this.simulation.diagnostics(),
    };
    this.listeners.forEach((listener) => listener());
  }
}
