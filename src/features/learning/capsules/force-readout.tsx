import { useLocale, useTranslations } from 'next-intl';
import { initialExperiment, UNITS } from '@/features/learning/model/experiment';
import { LEVEL_PRESENTATION } from '@/features/learning/model/level-presentation';
import { gravitationalForce } from '@/physics/gravity';
import { numberFormat } from '@/shared/i18n/number-format';
import type { Lesson } from './lesson';

export const INITIAL_FORCE = gravitationalForce(
  initialExperiment.mass1,
  initialExperiment.mass2,
  initialExperiment.distance,
);

// The same measured force, in newtons from the student level up and as a ratio for explorers.
export function ForceReadout({ lesson }: { lesson: Lesson }) {
  const t = useTranslations('learn');
  const locale = useLocale();
  const digits = LEVEL_PRESENTATION[lesson.level].forceDigits;
  const ratio = numberFormat(locale, { maximumSignificantDigits: 3 }).format(
    lesson.force / INITIAL_FORCE,
  );
  return (
    <div className="force-result" aria-live="polite">
      <span>{t('force')}</span>
      <output data-testid="force-value" data-force={lesson.force}>
        {digits === null ? (
          t('ratio', { ratio })
        ) : (
          <>
            {numberFormat(locale, {
              notation: 'scientific',
              maximumSignificantDigits: digits,
            }).format(lesson.force)}{' '}
            <small>{UNITS.force}</small>
          </>
        )}
      </output>
      {digits === null ? null : <p className="force-ratio">{t('ratio', { ratio })}</p>}
    </div>
  );
}
