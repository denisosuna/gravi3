import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import { LEVEL_PRESENTATION, READOUTS } from '@/features/learning/model/level-presentation';
import type { SimulatorPresetId } from '@/features/learning/model/simulator-presets';
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

function GuidedSimulation({ lesson, preset }: { lesson: Lesson; preset: SimulatorPresetId }) {
  useStartingPoint(lesson.simulator, preset);
  return (
    <div className="simulator-panel">
      <SimulatorStage controller={lesson.simulator} />
      <SimulationReadouts
        controller={lesson.simulator}
        shown={LEVEL_PRESENTATION[lesson.level].readouts}
      />
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
  useStartingPoint(lesson.simulator, 'figure-eight');
  return (
    <div className="simulator-panel">
      <SimulatorStage controller={lesson.simulator} />
      <SimulationReadouts controller={lesson.simulator} shown={READOUTS} />
    </div>
  );
}

// Everything at once and no script: every preset, every readout and the body editor.
export function LabCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('simulator');
  return (
    <div className="simulator-panel">
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
