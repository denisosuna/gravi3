import { useLocale, useTranslations } from 'next-intl';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/features/learning/model/experiment';
import { gravitationalForce } from '@/physics/gravity';
import { ForceDiagram } from '../lab/force-diagram';
import { LessonStep } from '../components/lesson-step';
import styles from '../components/learning.module.css';

const INITIAL_FORCE = gravitationalForce(
  initialExperiment.mass1,
  initialExperiment.mass2,
  initialExperiment.distance,
);

// The effect of doubling is shown right here, so the learner does not have to scroll back to the lab.
export function CheckStep({
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
  const ratio = new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 });
  return (
    <LessonStep step="check" title={t('checkTitle')}>
      <p className={styles.stepIntro}>{t('checkIntro')}</p>
      <p className={styles.prediction}>
        {experiment.prediction ? (
          <mark>{t('yourPrediction', { answer: t(experiment.prediction) })}</mark>
        ) : (
          t('noPrediction')
        )}
      </p>
      <div className="experiment-actions">
        <button
          className="button"
          disabled={experiment.distance * 2 > distanceRange.max}
          onClick={() => update({ distance: experiment.distance * 2, checked: true })}
        >
          {t('tryDistance')}
        </button>
        <button
          className="button"
          disabled={experiment.mass1 * 2 > massRange.max}
          onClick={() => update({ mass1: experiment.mass1 * 2, checked: true })}
        >
          {t('tryMass')}
        </button>
        <button
          className="button"
          onClick={() =>
            update({
              ...initialExperiment,
              prediction: experiment.prediction,
              checked: experiment.checked,
            })
          }
        >
          {t('backToStart')}
        </button>
      </div>
      <div className={styles.checkResult}>
        <ForceDiagram experiment={experiment} force={force} />
        <div aria-live="polite">
          <p className={styles.checkForce}>
            F = {scientific.format(force)} {UNITS.force}
          </p>
          <p className="force-ratio">
            {t('ratio', { ratio: ratio.format(force / INITIAL_FORCE) })}
          </p>
        </div>
      </div>
    </LessonStep>
  );
}
