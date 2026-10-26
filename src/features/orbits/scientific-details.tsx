'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import type { OrbitDefinition } from '@/physics/types';

export function ScientificDetails({ orbit }: { orbit: OrbitDefinition }) {
  const t = useTranslations('orbits');
  const locale = useLocale();
  return (
    <details className="scientific-details">
      <summary>{t('scientific')}</summary>
      <div>
        <p>
          {t('period')}:{' '}
          <strong>
            {new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(orbit.period)}
          </strong>{' '}
          {t('units')}
        </p>
        <p>{t('equalMasses')}</p>
        <p>{t('planar')}</p>
        <h3>{t('initialConditions')}</h3>
        <ol className="initial-conditions">
          {[0, 1, 2].map((body) => (
            <li key={body}>
              <strong>
                {t('body')} {body + 1}
              </strong>
              <span>
                {t('position')}: (
                {orbit.initialState
                  .slice(body * 2, body * 2 + 2)
                  .map((value) =>
                    new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(value),
                  )
                  .join('; ')}
                )
              </span>
              <span>
                {t('velocity')}: (
                {orbit.initialState
                  .slice(6 + body * 2, 8 + body * 2)
                  .map((value) =>
                    new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(value),
                  )
                  .join('; ')}
                )
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
