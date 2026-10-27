import type { Experiment } from '@/features/learning/model/experiment';
import type { TutorAction } from '@/features/tutor/model/tutor-actions';
import type { SimulatorController } from '../simulator/state/simulator-controller';
import type { LearnStep } from './learn-steps';

const LABORATORY_ID: LearnStep = 'observe';
const SIMULATOR_ID: LearnStep = 'three-bodies';

function reveal(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

// Runs an experiment proposed by the tutor and scrolls to where its effect is visible.
export function applyTutorAction(
  action: TutorAction,
  updateExperiment: (patch: Partial<Experiment>) => void,
  simulator: SimulatorController,
) {
  switch (action.type) {
    case 'setExperiment': {
      const { mass1, mass2, distance } = action;
      const patch = Object.fromEntries(
        Object.entries({ mass1, mass2, distance }).filter(([, value]) => value !== undefined),
      );
      updateExperiment(patch);
      reveal(LABORATORY_ID);
      return;
    }
    case 'loadPreset':
      simulator.loadPreset(action.preset);
      simulator.update({ playing: true });
      reveal(SIMULATOR_ID);
      return;
    case 'perturb':
      simulator.perturb();
      simulator.update({ playing: true });
      reveal(SIMULATOR_ID);
      return;
    // Orbit actions never reach the Learn page: the server only allows them on orbit pages.
    case 'openOrbit':
    case 'seekOrbit':
    case 'setOrbitSpeed':
      return;
  }
}
