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
        <a href={orbit.source} target="_blank" rel="noreferrer">
          {t('source')}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </details>
  );
}
