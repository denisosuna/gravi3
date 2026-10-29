import type { Level } from '@/features/calibration/model/calibration';
import type { Experiment } from '@/features/learning/model/experiment';
import type { SimulatorController } from '../simulator/state/simulator-controller';

// Everything a capsule may read or change; the experiment and the simulator outlive any one capsule.
export interface Lesson {
  experiment: Experiment;
  force: number;
  update: (patch: Partial<Experiment>) => void;
  simulator: SimulatorController;
  level: Level;
}
