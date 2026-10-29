import { useLocale, useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/features/learning/model/experiment';
import { numberFormat } from '@/shared/i18n/number-format';

type SliderKey = 'mass1' | 'mass2' | 'distance';

export function ExperimentSliders({
  keys,
  experiment,
  update,
}: {
  keys: readonly SliderKey[];
  experiment: Experiment;
  update: (patch: Partial<Experiment>) => void;
}) {
  const t = useTranslations('learn');
  const number = numberFormat(useLocale(), { maximumFractionDigits: 1 });
  return (
    <>
      <div className="lab-inputs">
        {keys.map((key) => (
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
      <button
        type="button"
        className="button"
        onClick={() =>
          update({
            ...initialExperiment,
            prediction: experiment.prediction,
            checked: experiment.checked,
          })
        }
      >
        <RotateCcw size={16} aria-hidden="true" />
        {t('reset')}
      </button>
    </>
  );
}
