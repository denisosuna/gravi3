import { useLocale, useTranslations } from 'next-intl';
import { UNITS } from '@/features/learning/model/experiment';
import { LEVEL_PRESENTATION } from '@/features/learning/model/level-presentation';
import { STANDARD_GRAVITY } from '@/physics/gravity';
import { numberFormat } from '@/shared/i18n/number-format';
import { ForceLab } from '../lab/force-lab';
import { ExperimentSliders } from './experiment-sliders';
import { ForceReadout, levelForceFormat } from './force-readout';
import type { Lesson } from './lesson';
import styles from './capsules.module.css';

export function PullCapsule({ lesson }: { lesson: Lesson }) {
  return (
    <>
      <ForceLab experiment={lesson.experiment} force={lesson.force} />
      <ExperimentSliders
        keys={['mass1', 'mass2', 'distance']}
        experiment={lesson.experiment}
        update={lesson.update}
      />
      <ForceReadout lesson={lesson} />
    </>
  );
}

export function MutualCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('learn');
  const { mass1, mass2 } = lesson.experiment;
  return (
    <>
      <ForceLab experiment={lesson.experiment} force={lesson.force} />
      <ExperimentSliders
        keys={['mass1', 'mass2']}
        experiment={lesson.experiment}
        update={lesson.update}
      />
      <p className={styles.note} aria-live="polite">
        {mass1 === mass2 ? t('equalMasses') : mass1 < mass2 ? t('body1Lighter') : t('body2Lighter')}
      </p>
    </>
  );
}

// Real numbers: the pull between everyday masses next to the weight of one of them.
export function NumbersCapsule({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const { experiment, force } = lesson;
  // This capsule starts at the student level, so a level format always exists.
  const scientific =
    levelForceFormat(locale, lesson.level) ?? numberFormat(locale, { notation: 'scientific' });
  const weight = experiment.mass1 * STANDARD_GRAVITY;
  const facts = [
    ['force', `${scientific.format(force)} ${UNITS.force}`],
    ['weight', `${scientific.format(weight)} ${UNITS.force}`],
    ['weightRatio', scientific.format(weight / force)],
  ] as const;
  return (
    <>
      <dl className={styles.facts}>
        {facts.map(([key, value]) => (
          <div key={key}>
            <dt>{t(`numbers.${key}`)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <ExperimentSliders
        keys={['mass1', 'mass2', 'distance']}
        experiment={experiment}
        update={lesson.update}
      />
      {LEVEL_PRESENTATION[lesson.level].constants ? (
        <p className={styles.constant}>
          a₁ = {scientific.format(force / experiment.mass1)} {UNITS.acceleration} · a₂ ={' '}
          {scientific.format(force / experiment.mass2)} {UNITS.acceleration}
        </p>
      ) : null}
    </>
  );
}
