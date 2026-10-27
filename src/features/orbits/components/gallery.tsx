'use client';

import Image from 'next/image';
import { useLayoutEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ASSETS, ROUTES } from '@/shared/constants/routes';
import { ORBIT_CATALOG } from '@/physics/orbit-catalog';
import { Link } from '@/i18n/routing';
import type { OrbitDefinition } from '@/physics/types';
import { useSessionMemory } from '@/shared/ui/providers';
import { ComparePanel } from './compare-panel';
import { GalleryControls } from './gallery-controls';
import {
  galleryHref,
  selectOrbits,
  toggleCompared,
  type GalleryQuery,
} from '../model/gallery-query';
import { GALLERY_SESSION } from '../model/gallery-session';
import styles from './gallery.module.css';
import { numberFormat } from '@/shared/i18n/number-format';

const PERIOD_DIGITS = 2;
const cardId = (slug: string) => `orbit-${slug}`;

function Plate({ orbit, query }: { orbit: OrbitDefinition; query: GalleryQuery }) {
  const t = useTranslations('orbits');
  const memory = useSessionMemory();
  const period = numberFormat(useLocale(), { maximumFractionDigits: PERIOD_DIGITS });
  const { code, family, discovery } = ORBIT_CATALOG[orbit.slug];
  const name = t(`${orbit.slug}.name`);
  const compared = query.compare.includes(orbit.slug);
  return (
    <article className={styles.plate}>
      <div className={styles.plateImage}>
        <Image src={ASSETS.orbitPreview(orbit.slug)} alt="" width={320} height={200} />
      </div>
      <h2 className={styles.plateTitle}>
        <Link
          id={cardId(orbit.slug)}
          href={ROUTES.orbit(orbit.slug)}
          className={styles.plateLink}
          onClick={() =>
            memory.set(GALLERY_SESSION, {
              scroll: window.scrollY,
              selected: orbit.slug,
              restoreFocus: true,
              href: galleryHref(query),
            })
          }
        >
          {name}
        </Link>
      </h2>
      <dl className={styles.placard}>
        <dt>{t('filters.class')}</dt>
        <dd>{family === 'analytic' ? t('filters.analytic') : (code ?? family)}</dd>
        <dt>{t('detail.found')}</dt>
        <dd>{t('plate.found', { authors: discovery.authors, year: String(discovery.year) })}</dd>
        <dt>{t('period')}</dt>
        <dd className={styles.number}>T = {period.format(orbit.period)}</dd>
      </dl>
      <Link
        href={galleryHref(toggleCompared(query, orbit.slug))}
        replace
        scroll={false}
        className={styles.compareToggle}
        data-active={compared || undefined}
      >
        {t(compared ? 'plate.uncompare' : 'plate.compare', { name })}
      </Link>
    </article>
  );
}

export function Gallery({ query }: { query: GalleryQuery }) {
  const t = useTranslations('orbits');
  const memory = useSessionMemory();
  const gallery = memory.get(GALLERY_SESSION);
  const shown = selectOrbits(query);
  // Returning from a detail page restores the previous scroll position and focus.
  useLayoutEffect(() => {
    if (!gallery.restoreFocus) return;
    window.scrollTo(0, gallery.scroll);
    if (gallery.selected)
      document.getElementById(cardId(gallery.selected))?.focus({ preventScroll: true });
    memory.set(GALLERY_SESSION, { ...gallery, restoreFocus: false });
  }, [gallery, memory]);
  return (
    <>
      <GalleryControls query={query} />
      <ComparePanel query={query} />
      <p className={styles.count} role="status">
        {t('showing', { count: shown.length })}
      </p>
      <ul className={styles.plates}>
        {shown.map((orbit) => (
          <li key={orbit.slug}>
            <Plate orbit={orbit} query={query} />
          </li>
        ))}
      </ul>
    </>
  );
}
