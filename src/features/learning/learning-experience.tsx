'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useExperienceMemory } from '@/components/providers';
import { distanceRange, initialExperiment, massRange, type Experiment } from '@/data/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { ForceDiagram } from './force-diagram';
import { Prediction } from './prediction';

export function LearningExperience() {
  const t = useTranslations('learn');
  const locale = useLocale();
  const memory = useExperienceMemory();
  const [experiment, setExperiment] = useState(() => memory.getExperiment());
  function update(patch: Partial<Experiment>) {
    const next = { ...experiment, ...patch };
    memory.saveExperiment(next);
    setExperiment(next);
  }
  const force = gravitationalForce(experiment.mass1, experiment.mass2, experiment.distance);
  const format = new Intl.NumberFormat(locale, {
    notation: 'scientific',
    maximumSignificantDigits: 4,
  });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <div className="learning-layout">
      <div className="learning-main">
        <section className="laboratory-panel">
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
          <ForceDiagram experiment={experiment} />
          <div className="lab-inputs">
            {(['mass1', 'mass2', 'distance'] as const).map((key) => (
              <label key={key}>
                <span>
                  {t(key)}
                  <output>
                    {number.format(experiment[key])} {key === 'distance' ? 'm' : 'kg'}
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
              {format.format(force)} <small>N</small>
            </output>
            <p>{t('equal')}</p>
            <div className="acceleration-values">
              <span>a₁ = {format.format(force / experiment.mass1)} m/s²</span>
              <span>a₂ = {format.format(force / experiment.mass2)} m/s²</span>
            </div>
          </div>
        </section>
        <Prediction
          answer={experiment.prediction}
          onAnswer={(prediction) => update({ prediction })}
        />
        <section className="learning-connection">
          <div className="eyebrow">{t('step3')}</div>
          <h2>{t('nextTitle')}</h2>
          <p>{t('nextText')}</p>
          <Link href="/orbits" className="button">
            {t('explore')}
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <aside className="learning-sidebar">
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
