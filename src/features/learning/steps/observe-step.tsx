import { useLocale, useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/data/experiment';
import { ForceLab } from '../lab/force-lab';
import { LessonStep } from '../lesson-step';

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
      <div className="force-result">
        <span>{t('force')}</span>
        <output data-testid="force-value" data-force={force}>
          {scientific.format(force)} <small>{UNITS.force}</small>
        </output>
        <p>{t('equal')}</p>
        <div className="acceleration-values">
          <span>
            a₁ = {scientific.format(force / experiment.mass1)} {UNITS.acceleration}
          </span>
          <span>
            a₂ = {scientific.format(force / experiment.mass2)} {UNITS.acceleration}
          </span>
        </div>
      </div>
    </LessonStep>
  );
}
