import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, FlaskConical } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { ORBIT_CATALOG, orbits } from '@/physics/orbit-catalog';
import { Link } from '@/i18n/routing';
import type { OrbitDefinition } from '@/physics/types';
import { BackToGallery } from './back-to-gallery';
import { OrbitPlaybackProvider, OrbitTutor, STAGE_ID } from './orbit-playback';
import { OrbitPlayer } from './orbit-player';
import { ScientificDetails } from './scientific-details';
import styles from './orbit-detail.module.css';
import { numberFormat } from '@/shared/i18n/number-format';

const TITLE_ID = 'orbit-title';
const DESCRIPTION_ID = 'orbit-visual';
const PERIOD_DIGITS = 4;

function neighbours(orbit: OrbitDefinition) {
  const index = orbits.indexOf(orbit);
  return {
    previous: orbits[(index - 1 + orbits.length) % orbits.length]!,
    next: orbits[(index + 1) % orbits.length]!,
  };
}

function Placard({ orbit }: { orbit: OrbitDefinition }) {
  const t = useTranslations('orbits');
  const period = numberFormat(useLocale(), { maximumFractionDigits: PERIOD_DIGITS });
  const { code, family, discovery } = ORBIT_CATALOG[orbit.slug];
  return (
    <dl className={styles.placard}>
      <dt>{t('detail.class')}</dt>
      <dd>{family === 'analytic' ? t('filters.analytic') : (code ?? family)}</dd>
      <dt>{t('detail.found')}</dt>
      <dd>{t('plate.found', { authors: discovery.authors, year: String(discovery.year) })}</dd>
      <dt>{t('period')}</dt>
      <dd>
        <span className={styles.number}>T = {period.format(orbit.period)}</span> {t('units')}
      </dd>
    </dl>
  );
}

export function OrbitDetail({ orbit }: { orbit: OrbitDefinition }) {
  const t = useTranslations('orbits');
  const name = t(`${orbit.slug}.name`);
  const { previous, next } = neighbours(orbit);
  return (
    <main id="main" className={styles.exhibit}>
      <nav className={styles.exhibitNav} aria-label={t('detail.nav')}>
        <BackToGallery className={styles.back} />
        <Link href={ROUTES.orbit(previous.slug)} className={styles.sibling} rel="prev">
          <ArrowLeft size={16} aria-hidden="true" />
          <span className={styles.siblingLabel}>{t('detail.previous')}:</span>
          {t(`${previous.slug}.name`)}
        </Link>
        <Link href={ROUTES.orbit(next.slug)} className={styles.sibling} rel="next">
          <span className={styles.siblingLabel}>{t('detail.next')}:</span>
          {t(`${next.slug}.name`)}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
      <OrbitPlaybackProvider key={orbit.slug} orbit={orbit}>
        <div className={styles.layout}>
          <section id={STAGE_ID} className={styles.stage} aria-labelledby={TITLE_ID}>
            <OrbitPlayer orbit={orbit} labels={{ label: name, descriptionId: DESCRIPTION_ID }} />
          </section>
          <article className={styles.text}>
            <header className={styles.header}>
              <h1 id={TITLE_ID}>{name}</h1>
              <p className={styles.lede}>{t(`${orbit.slug}.description`)}</p>
              <Placard orbit={orbit} />
            </header>
            <section>
              <h2>{t('detail.seeing')}</h2>
              <p id={DESCRIPTION_ID}>{t(`visual.${orbit.slug}`)}</p>
              <p className={styles.note}>{t('planar')}</p>
              <Link href={ROUTES.orbitInLab(orbit.slug)} className="button">
                <FlaskConical size={16} aria-hidden="true" />
                {t('detail.tryInLab')}
              </Link>
            </section>
            <section>
              <h2>{t('concept')}</h2>
              <p>{t('conceptText')}</p>
            </section>
            <ScientificDetails orbit={orbit} />
            <OrbitTutor slug={orbit.slug} />
          </article>
        </div>
      </OrbitPlaybackProvider>
    </main>
  );
}
