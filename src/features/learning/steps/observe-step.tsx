import { useLocale, useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/features/learning/model/experiment';
import { ForceLab } from '../lab/force-lab';
import { LessonStep } from '../components/lesson-step';
import styles from '../components/learning.module.css';

const SLIDERS = ['mass1', 'mass2', 'distance'] as const;

export function ObserveStep({
  experiment,
  force,
  update,
}: {
  experiment: Experiment;
  force: number;
  update: (patch: Partial<Experiment>) => void;
}) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const scientific = new Intl.NumberFormat(locale, {
    notation: 'scientific',
    maximumSignificantDigits: 4,
  });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (
    <LessonStep
      step="observe"
      title={t('observeTitle')}
      action={
        <button
          className="icon-button"
          aria-label={t('reset')}
          title={t('reset')}
          onClick={() => update(initialExperiment)}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      }
    >
      <ForceLab experiment={experiment} force={force} />
      <div className="lab-inputs">
        {SLIDERS.map((key) => (
          <label key={key}>
            <span>
              {t(key)}
              <output>
                {number.format(experiment[key])} {key === 'distance' ? UNITS.distance : UNITS.mass}
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
      <section className={styles.explanation} aria-live="polite">
        <h3>{t('whatHappensTitle')}</h3>
        <p>{t('mutualAttraction')}</p>
        <p>
          {experiment.mass1 === experiment.mass2
            ? t('equalMasses')
            : experiment.mass1 < experiment.mass2
              ? t('body1Lighter')
              : t('body2Lighter')}
        </p>
        <p>{t('distanceEffect')}</p>
        <p>{t('twoBodyPurpose')}</p>
      </section>
      <div className="force-result">
        <span>{t('force')}</span>
        <output data-testid="force-value" data-force={force}>
          {scientific.format(force)} <small>{UNITS.force}</small>
        </output>
        <details className={styles.accelerationDetails}>
          <summary>{t('accelerationDetails')}</summary>
          <p>{t('accelerationMeaning')}</p>
          <div className="acceleration-values">
            <span>
              a₁ = {scientific.format(force / experiment.mass1)} {UNITS.acceleration}
            </span>
            <span>
              a₂ = {scientific.format(force / experiment.mass2)} {UNITS.acceleration}
            </span>
          </div>
        </details>
      </div>
    </LessonStep>
  );
}
