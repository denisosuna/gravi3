'use client';

import { useState } from 'react';
import { createSessionKey, useSessionMemory, useSessionValue } from '@/shared/ui/providers';
import { DEFAULT_LEVEL } from '@/features/calibration/model/calibration';
import { LEVEL_SESSION } from '@/features/calibration/model/level-session';
import { initialExperiment, type Experiment } from '@/features/learning/model/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { TutorPanel } from '@/features/tutor/components/tutor-panel';
import { applyTutorAction } from '../model/apply-tutor-action';
import { capsulesForLevel, resolveCapsule } from '../model/capsules';
import { ChapterRail, TUTOR_ANCHOR } from '../deck/chapter-rail';
import { Deck } from '../deck/deck';
import { openCapsule, useCapsuleHash } from '../deck/use-capsule-hash';
import { CapsuleContent } from '../capsules/capsule-content';
import type { Lesson } from '../capsules/lesson';
import { SimulatorController } from '../simulator/state/simulator-controller';
import { useSimulatorState } from '../simulator/state/use-simulator-state';
import styles from './learning.module.css';

const EXPERIMENT_SESSION = createSessionKey<Experiment>('experiment', () => ({
  ...initialExperiment,
}));

// Chapters of short capsules filtered by level; the experiment and simulator persist across them.
export function LearningExperience() {
  const memory = useSessionMemory();
  const [experiment, setExperiment] = useState(() => memory.get(EXPERIMENT_SESSION));
  const [simulator] = useState(() => new SimulatorController());
  const simulatorPreset = useSimulatorState(simulator, (state) => state.presetId);
  const simulatorEvent = useSimulatorState(simulator, (state) => state.event ?? null);
  const level = useSessionValue(LEVEL_SESSION).level ?? DEFAULT_LEVEL;
  const deck = capsulesForLevel(level);
  const current = resolveCapsule(useCapsuleHash(), deck);

  function update(patch: Partial<Experiment>) {
    const next = { ...experiment, ...patch };
    memory.set(EXPERIMENT_SESSION, next);
    setExperiment(next);
  }

  const force = gravitationalForce(experiment.mass1, experiment.mass2, experiment.distance);
  const lesson: Lesson = { experiment, force, update, simulator, level };
  return (
    <div className={styles.layout}>
      <ChapterRail deck={deck} current={current} />
      <div className={styles.main}>
        <Deck deck={deck} current={current}>
          <CapsuleContent id={current.id} lesson={lesson} />
        </Deck>
      </div>
      <aside id={TUTOR_ANCHOR} className={styles.margin} tabIndex={-1}>
        <TutorPanel
          context={{
            kind: 'learning',
            ...experiment,
            level,
            capsule: current.id,
            simulator: { preset: simulatorPreset, event: simulatorEvent },
          }}
          onAction={(action) =>
            applyTutorAction(action, update, simulator, (capsule) => openCapsule(capsule, 'push'))
          }
        />
      </aside>
    </div>
  );
}
