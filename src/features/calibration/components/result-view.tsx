import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import type { LearnStep } from '@/features/learning/model/learn-steps';
import {
  LEVELS,
  type CalibrationResult,
  type Level,
  type Misconception,
} from '../model/calibration';
import styles from './calibration.module.css';

// The Learn step where each idea is worked on.
const REVIEW_STEPS: Readonly<Record<Misconception, LearnStep>> = {
  'one-way-gravity': 'observe',
  'heavier-falls-faster': 'observe',
  'linear-distance': 'predict',
  'constant-gravity': 'predict',
  'chaos-is-random': 'three-bodies',
  'no-sensitivity': 'three-bodies',
};

export function ResultView({
  result,
  level,
  onLevel,
  onRepeat,
}: {
  result: CalibrationResult;
  level: Level;
  onLevel: (level: Level) => void;
  onRepeat: () => void;
}) {
  const t = useTranslations('calibration.result');
  const levels = useTranslations('calibration.levels');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className={styles.result}>
      <section className={styles.panel} aria-labelledby="calibration-result">
        <h1 id="calibration-result" ref={heading} tabIndex={-1}>
          {t('title', { level: levels(`${level}.name`) })}
        </h1>
        <p className={styles.lede}>{levels(`${level}.help`)}</p>
        <fieldset className={styles.levels}>
          <legend>{t('chooseLevel')}</legend>
          {LEVELS.map((option) => (
            <label
              key={option}
              className={styles.option}
              data-checked={level === option || undefined}
            >
              <input
                type="radio"
                name="level"
                value={option}
                checked={level === option}
                onChange={() => onLevel(option)}
              />
              <span>{levels(`${option}.name`)}</span>
            </label>
          ))}
        </fieldset>
      </section>
      <section className={styles.panel} aria-labelledby="calibration-known">
        <h2 id="calibration-known">{t('known')}</h2>
        {result.known.length > 0 ? (
          <ul className={styles.list}>
            {result.known.map((id) => (
              <li key={id}>
                <Check size={18} aria-hidden="true" />
                {t(`knownItems.${id}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>{t('knownNone')}</p>
        )}
        <h2>{t('review')}</h2>
        {result.review.length > 0 ? (
          <ul className={styles.links}>
            {result.review.map((misconception) => (
              <li key={misconception}>
                <Link href={`${ROUTES.learn}#${REVIEW_STEPS[misconception]}`}>
                  {t(`reviewItems.${misconception}`)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>{t('reviewNone')}</p>
        )}
      </section>
      <div className={styles.actions}>
        <Link href={ROUTES.learn} className="button primary">
          {t('start')}
        </Link>
        <button type="button" className="button" onClick={onRepeat}>
          {t('repeat')}
        </button>
      </div>
    </div>
  );
}
