import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { BODY_INDICES, bodyPosition, bodyVelocity, type OrbitDefinition } from '@/physics/types';
import { numberFormat } from '@/shared/i18n/number-format';

const PERIOD_DIGITS = 8;
const CONDITION_DIGITS = 10;

export function ScientificDetails({ orbit }: { orbit: OrbitDefinition }) {
  const t = useTranslations('orbits');
  const locale = useLocale();
  const period = numberFormat(locale, { maximumFractionDigits: PERIOD_DIGITS });
  const condition = numberFormat(locale, { maximumFractionDigits: CONDITION_DIGITS });
  const formatVector = (vector: readonly number[]) =>
    `(${vector.map((value) => condition.format(value)).join('; ')})`;
  return (
    <details className="scientific-details">
      <summary>{t('scientific')}</summary>
      <div>
        <p>
          {t('period')}: <strong>{period.format(orbit.period)}</strong> {t('units')}
        </p>
        <p>{t('equalMasses')}</p>
        <p>{t('planar')}</p>
        <h3>{t('initialConditions')}</h3>
        <ol className="initial-conditions">
          {BODY_INDICES.map((body) => (
            <li key={body}>
              <strong>
                {t('body')} {body + 1}
              </strong>
              <span>
                {t('position')}: {formatVector(bodyPosition(orbit.initialState, body))}
              </span>
              <span>
                {t('velocity')}: {formatVector(bodyVelocity(orbit.initialState, body))}
              </span>
            </li>
          ))}
        </ol>
        <a href={orbit.source} target="_blank" rel="noreferrer">
          {t('source')}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </details>
  );
}
