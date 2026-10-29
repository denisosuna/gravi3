import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import { LEVELS, type Level } from '@/features/calibration/model/calibration';
import styles from './level-bar.module.css';

// The level in use, changeable at any moment, with the calibration one link away.
export function LevelBar({
  level,
  chosen,
  onLevel,
}: {
  level: Level;
  // False until the learner calibrates or picks a level; the default is used meanwhile.
  chosen: boolean;
  onLevel: (level: Level) => void;
}) {
  const t = useTranslations('learn.level');
  const levels = useTranslations('calibration.levels');
  return (
    <section className={styles.bar} aria-labelledby="level-bar-title">
      <fieldset className={styles.levels}>
        <legend id="level-bar-title">{t('label')}</legend>
        {LEVELS.map((option) => (
          <label key={option} data-checked={level === option || undefined}>
            <input
              type="radio"
              name="learn-level"
              value={option}
              checked={level === option}
              onChange={() => onLevel(option)}
            />
            {levels(`${option}.name`)}
          </label>
        ))}
      </fieldset>
      <p className={styles.help}>{chosen ? levels(`${level}.help`) : t('notChosen')}</p>
      <Link href={ROUTES.calibration} className={chosen ? 'button' : 'button primary'}>
        {t('calibrate')}
      </Link>
    </section>
  );
}
