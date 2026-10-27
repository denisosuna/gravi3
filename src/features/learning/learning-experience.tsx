'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { createSessionKey, useSessionMemory } from '@/components/providers';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/data/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { ForceLab } from './lab/force-lab';
import { applyTutorAction, LABORATORY_ID } from './apply-tutor-action';
import { SimulatorController } from './simulator/simulator-controller';
import { ThreeBodySimulator } from './simulator/three-body-simulator';
import { useSimulatorState } from './simulator/use-simulator-state';
import { Prediction } from './prediction';
import { TutorPanel } from '@/components/tutor/tutor-panel';

const EXPERIMENT_SESSION = createSessionKey<Experiment>('experiment', () => ({
  ...initialExperiment,
}));

const INITIAL_FORCE = gravitationalForce(
  initialExperiment.mass1,
  initialExperiment.mass2,
  initialExperiment.distance,
);

export function LearningExperience() {
  const t = useTranslations('learn');
  const locale = useLocale();
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
  const format = new Intl.NumberFormat(locale, {
    notation: 'scientific',
    maximumSignificantDigits: 4,
  });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const ratioFormat = new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 });
  return (
    <div className="learning-layout">
      <div className="learning-main">
        <section className="laboratory-panel" id={LABORATORY_ID}>
          <div className="lab-heading">
            <div className="eyebrow">{t('step1')}</div>
            <button
              className="icon-button"
              aria-label={t('reset')}
              title={t('reset')}
              onClick={() => update(initialExperiment)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <ForceLab experiment={experiment} force={force} />
          <div className="lab-inputs">
            {(['mass1', 'mass2', 'distance'] as const).map((key) => (
              <label key={key}>
                <span>
                  {t(key)}
                  <output>
                    {number.format(experiment[key])}{' '}
                    {key === 'distance' ? UNITS.distance : UNITS.mass}
                  </output>
                </span>
                <input
                  type="range"
                  aria-label={t(key)}
                  {...(key === 'distance' ? distanceRange : massRange)}
                  value={experiment[key]}
                  onChange={(event) => update({ [key]: Number(event.target.value) })}
                />
              </label>
            ))}
          </div>
          <div className="experiment-actions">
            <button
              className="button"
              disabled={experiment.mass1 * 2 > massRange.max}
              onClick={() => update({ mass1: experiment.mass1 * 2 })}
            >
              {t('tryMass')}
            </button>
            <button
              className="button"
              disabled={experiment.distance * 2 > distanceRange.max}
              onClick={() => update({ distance: experiment.distance * 2 })}
            >
              {t('tryDistance')}
            </button>
          </div>
          <div className="force-result">
            <span>{t('force')}</span>
            <output data-testid="force-value" data-force={force}>
              {format.format(force)} <small>{UNITS.force}</small>
            </output>
            <p className="force-ratio">
              {t('ratio', { ratio: ratioFormat.format(force / INITIAL_FORCE) })}
            </p>
            <p>{t('equal')}</p>
            <div className="acceleration-values">
              <span>
                a₁ = {format.format(force / experiment.mass1)} {UNITS.acceleration}
              </span>
              <span>
                a₂ = {format.format(force / experiment.mass2)} {UNITS.acceleration}
              </span>
            </div>
          </div>
        </section>
        <Prediction
          answer={experiment.prediction}
          onAnswer={(prediction) => update({ prediction })}
        />
        <ThreeBodySimulator controller={simulator} />
      </div>
      <aside className="learning-sidebar">
        <TutorPanel
          context={{
            kind: 'learning',
            ...experiment,
            simulator: { preset: simulatorPreset, event: simulatorEvent },
          }}
          onAction={(action) => applyTutorAction(action, update, simulator)}
        />
        <section className="formula-panel">
          <h2>{t('formulaTitle')}</h2>
          <p className="formula">F = G · m₁ · m₂ / r²</p>
          <p>{t('formulaText')}</p>
          <small>{t('constant')}</small>
        </section>
      </aside>
    </div>
  );
}
