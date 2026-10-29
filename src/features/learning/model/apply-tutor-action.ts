import type { Experiment } from '@/features/learning/model/experiment';
import type { TutorAction } from '@/features/tutor/model/tutor-actions';
import type { SimulatorController } from '../simulator/state/simulator-controller';
import type { CapsuleId } from './capsules';

// Where the effect of each kind of experiment can be seen.
const LABORATORY: CapsuleId = 'pull';
const SIMULATOR: CapsuleId = 'lab';

// Runs an experiment proposed by the tutor, then opens the capsule that shows its effect.
export function applyTutorAction(
  action: TutorAction,
  updateExperiment: (patch: Partial<Experiment>) => void,
  simulator: SimulatorController,
  reveal: (capsule: CapsuleId) => void,
) {
  switch (action.type) {
    case 'setExperiment': {
      const { mass1, mass2, distance } = action;
      const patch = Object.fromEntries(
        Object.entries({ mass1, mass2, distance }).filter(([, value]) => value !== undefined),
      );
      updateExperiment(patch);
      reveal(LABORATORY);
      return;
    }
    case 'loadPreset':
      reveal(SIMULATOR);
      simulator.loadPreset(action.preset);
      simulator.update({ playing: true });
      return;
    case 'perturb':
      reveal(SIMULATOR);
      simulator.perturb();
      simulator.update({ playing: true });
      return;
    // Orbit actions never reach the Learn page: the server only allows them on orbit pages.
    case 'openOrbit':
    case 'seekOrbit':
    case 'setOrbitSpeed':
      return;
  }
}
