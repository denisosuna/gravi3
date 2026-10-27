'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createSessionKey, useSessionMemory } from '@/shared/ui/providers';
import { initialExperiment, type Experiment } from '@/features/learning/model/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { TutorPanel } from '@/features/tutor/components/tutor-panel';
import { applyTutorAction } from '../model/apply-tutor-action';
import { TUTOR_ANCHOR } from '../model/learn-steps';
import { LessonStep } from './lesson-step';
import { Prediction } from './prediction';
import { SimulatorController } from '../simulator/state/simulator-controller';
import { ThreeBodySimulator } from '../simulator/components/three-body-simulator';
import { useSimulatorState } from '../simulator/state/use-simulator-state';
import { StepRail } from './step-rail';
import { CheckStep } from '../steps/check-step';
import { ExplainStep } from '../steps/explain-step';
import { ObserveStep } from '../steps/observe-step';
import styles from './learning.module.css';

const EXPERIMENT_SESSION = createSessionKey<Experiment>('experiment', () => ({
  ...initialExperiment,
}));

// A lab notebook: observe, predict, check, explain, then add a third body. The tutor writes in the margin.
export function LearningExperience() {
  const t = useTranslations('learn');
  const simulatorText = useTranslations('simulator');
  const memory = useSessionMemory();
  const [experiment, setExperiment] = useState(() => memory.get(EXPERIMENT_SESSION));
  const [simulator] = useState(() => new SimulatorController());
  const simulatorPreset = useSimulatorState(simulator, (state) => state.presetId);
  const simulatorEvent = useSimulatorState(simulator, (state) => state.event ?? null);
  function update(patch: Partial<Experiment>) {
    const next = { ...experiment, ...patch };
    memory.set(EXPERIMENT_SESSION, next);
    setExperiment(next);
  }
  const force = gravitationalForce(experiment.mass1, experiment.mass2, experiment.distance);
  return (
    <div className={styles.layout}>
      <StepRail />
      <div className={styles.steps}>
        <ObserveStep experiment={experiment} force={force} update={update} />
        <LessonStep step="predict" title={t('predictionTitle')}>
          <Prediction
            answer={experiment.prediction}
            onAnswer={(prediction) => update({ prediction })}
          />
        </LessonStep>
        <CheckStep experiment={experiment} force={force} update={update} />
        <ExplainStep />
        <LessonStep step="three-bodies" title={simulatorText('title')}>
          <ThreeBodySimulator controller={simulator} />
        </LessonStep>
      </div>
      <aside id={TUTOR_ANCHOR} className={styles.margin}>
        <TutorPanel
          context={{
            kind: 'learning',
            ...experiment,
            simulator: { preset: simulatorPreset, event: simulatorEvent },
          }}
          onAction={(action) => applyTutorAction(action, update, simulator)}
        />
      </aside>
    </div>
  );
}
