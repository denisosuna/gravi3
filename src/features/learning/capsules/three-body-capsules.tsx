import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import {
  LEVEL_PRESENTATION,
  READOUTS,
  type Readout,
} from '@/features/learning/model/level-presentation';
import {
  CUSTOM_PRESET,
  isSimulatorPreset,
  type SimulatorPresetId,
} from '@/features/learning/model/simulator-presets';
import { useSimulatorState } from '../simulator/state/use-simulator-state';
import { BodyEditor } from '../simulator/components/body-editor';
import { SimulationReadouts } from '../simulator/components/simulation-readouts';
import { SimulatorPresets } from '../simulator/components/simulator-controls';
import { SimulatorStage } from '../simulator/components/simulator-stage';
import type { SimulatorController } from '../simulator/state/simulator-controller';
import type { Lesson } from './lesson';

// A guided capsule starts from the system it talks about; the free laboratory keeps whatever is loaded.
function useStartingPoint(simulator: SimulatorController, preset: SimulatorPresetId) {
  useEffect(() => simulator.loadPreset(preset), [simulator, preset]);
}

function GuidedSimulation({
  lesson,
  preset,
  shown = LEVEL_PRESENTATION[lesson.level].readouts,
}: {
  lesson: Lesson;
  preset: SimulatorPresetId;
  // The readouts on screen; by default, those of the learner's level.
  shown?: readonly Readout[];
}) {
  useStartingPoint(lesson.simulator, preset);
  return (
    <div className="simulator-panel">
      <SimulatorStage controller={lesson.simulator} />
      <SimulationReadouts controller={lesson.simulator} shown={shown} />
    </div>
  );
}

export function ThirdCapsule({ lesson }: { lesson: Lesson }) {
  return <GuidedSimulation lesson={lesson} preset="figure-eight" />;
}

export function ChaosCapsule({ lesson }: { lesson: Lesson }) {
  return <GuidedSimulation lesson={lesson} preset="pythagorean" />;
}

export function UnstableCapsule({ lesson }: { lesson: Lesson }) {
  return <GuidedSimulation lesson={lesson} preset="lagrange" />;
}

export function EnergyCapsule({ lesson }: { lesson: Lesson }) {
  return <GuidedSimulation lesson={lesson} preset="figure-eight" shown={READOUTS} />;
}

// Everything at once and no script: every preset, every readout and the body editor.
export function LabCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('simulator');
  const orbits = useTranslations('orbits');
  const loaded = useSimulatorState(lesson.simulator, (state) => state.presetId);
  const fromGallery = loaded !== CUSTOM_PRESET && !isSimulatorPreset(loaded);
  return (
    <div className="simulator-panel">
      {fromGallery ? (
        <p className="simulator-origin">{t('fromGallery', { name: orbits(`${loaded}.name`) })}</p>
      ) : null}
      <SimulatorPresets controller={lesson.simulator} />
      <SimulatorStage controller={lesson.simulator} />
      <SimulationReadouts controller={lesson.simulator} shown={READOUTS} />
      <BodyEditor controller={lesson.simulator} />
      <p className="simulator-model">{t('model')}</p>
      <div className="simulator-next">
        <p>{t('next')}</p>
        <Link href={ROUTES.orbits} className="button">
          {t('explore')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
