import { useLocale, useTranslations } from 'next-intl';
import {
  distanceRange,
  initialExperiment,
  massRange,
  UNITS,
  type Experiment,
} from '@/features/learning/model/experiment';
import { LEVEL_PRESENTATION } from '@/features/learning/model/level-presentation';
import { numberFormat } from '@/shared/i18n/number-format';
import { Prediction } from '../components/prediction';
import { ForceDiagram } from '../lab/force-diagram';
import { INITIAL_FORCE, levelForceFormat } from './force-readout';
import type { Lesson } from './lesson';
import styles from './capsules.module.css';

type Doubling = 'mass1' | 'distance';

const DOUBLING_LIMITS: Readonly<Record<Doubling, number>> = {
  mass1: massRange.max,
  distance: distanceRange.max,
};
const DOUBLING_LABELS: Readonly<Record<Doubling, 'tryMass' | 'tryDistance'>> = {
  mass1: 'tryMass',
  distance: 'tryDistance',
};

// Doubling one quantity and reading the new force against the starting one, side by side.
function DoublingCheck({ quantity, lesson }: { quantity: Doubling; lesson: Lesson }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const { experiment, force, update } = lesson;
  const newtons = levelForceFormat(locale, lesson.level);
  const ratio = numberFormat(locale, { maximumSignificantDigits: 3 });
  const restart: Partial<Experiment> = {
    mass1: initialExperiment.mass1,
    mass2: initialExperiment.mass2,
    distance: initialExperiment.distance,
  };
  return (
    <>
      <div className="experiment-actions">
        <button
          type="button"
          className="button primary"
          disabled={experiment[quantity] * 2 > DOUBLING_LIMITS[quantity]}
          onClick={() =>
            update({
              [quantity]: experiment[quantity] * 2,
              // Only doubling the distance tests the prediction the tutor asks about.
              checked: experiment.checked || quantity === 'distance',
            })
          }
        >
          {t(DOUBLING_LABELS[quantity])}
        </button>
        <button type="button" className="button" onClick={() => update(restart)}>
          {t('backToStart')}
        </button>
      </div>
      <div className={styles.checkResult}>
        <ForceDiagram experiment={experiment} force={force} />
        <div aria-live="polite">
          {newtons === null ? null : (
            <p className={styles.checkForce}>
              F = {newtons.format(force)} {UNITS.force}
            </p>
          )}
          <p className="force-ratio">
            {t('ratio', { ratio: ratio.format(force / INITIAL_FORCE) })}
          </p>
        </div>
      </div>
    </>
  );
}

export function MassCapsule({ lesson }: { lesson: Lesson }) {
  return <DoublingCheck quantity="mass1" lesson={lesson} />;
}

export function PredictCapsule({ lesson }: { lesson: Lesson }) {
  return (
    <Prediction
      answer={lesson.experiment.prediction}
      onAnswer={(prediction) => lesson.update({ prediction })}
    />
  );
}

export function CheckCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('learn');
  const { prediction } = lesson.experiment;
  return (
    <>
      <p className={styles.prediction}>
        {prediction ? (
          <mark>{t('yourPrediction', { answer: t(prediction) })}</mark>
        ) : (
          t('noPrediction')
        )}
      </p>
      <DoublingCheck quantity="distance" lesson={lesson} />
    </>
  );
}

// Explorers open the formula when they want it; the other levels see it, advanced with G.
export function FormulaCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('learn');
  const { formulaOpen, constants } = LEVEL_PRESENTATION[lesson.level];
  const formula = (
    <>
      <p className={styles.formula}>F = G · m₁ · m₂ / r²</p>
      <p className={styles.note}>{t('formulaText')}</p>
      {constants ? <p className={styles.constant}>{t('constant')}</p> : null}
    </>
  );
  if (formulaOpen) return formula;
  return (
    <details className={styles.formulaToggle}>
      <summary>{t('showFormula')}</summary>
      {formula}
    </details>
  );
}
