'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { OrbitLibrary } from './gallery';
import { OrbitPlayer } from './orbit-player';
import { TutorPanel } from '@/components/tutor/tutor-panel';
import { ScientificDetails } from './scientific-details';
import type { OrbitDefinition } from '@/physics/types';

export function OrbitDetail({ orbit }: { orbit: OrbitDefinition }) {
  const t = useTranslations('orbits');
  const common = useTranslations('common');
  return (
    <main id="main" className="orbit-layout">
      <OrbitLibrary selected={orbit.slug} />
      <div className="detail-workspace">
        <section className="orbit-stage" aria-label={t(`${orbit.slug}.name`)}>
          <div className="stage-heading">
            <Link className="back-link" href="/orbits" scroll={false}>
              <ArrowLeft size={14} />
              {common('back')}
            </Link>
            <div className="eyebrow">{t('orbit')}</div>
            <h1>{t(`${orbit.slug}.name`)}</h1>
            <p>{t(`${orbit.slug}.description`)}</p>
          </div>
          <OrbitPlayer key={orbit.slug} orbit={orbit} />
          <div className="stage-caption">
            <span className="status-dot" />
            {t('validated')}
            <span>{[1, 2, 3].map((body) => `${t('body')} ${body}`).join(' · ')}</span>
          </div>
        </section>
        <aside className="context-column">
          <TutorPanel context={{ kind: 'orbit', slug: orbit.slug }} />
          <section className="concept-panel">
            <div className="panel-heading">
              <Sparkles size={22} />
              <h2>{t('concept')}</h2>
            </div>
            <p>{t('conceptText')}</p>
            <div className="concept-preview">
              <Image src={`/previews/${orbit.slug}.svg`} alt="" width={256} height={128} />
            </div>
            <p className="small-copy">{t('planar')}</p>
          </section>
          <ScientificDetails orbit={orbit} />
        </aside>
      </div>
    </main>
  );
}
