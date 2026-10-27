import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { ORBIT_FAMILIES, type OrbitFamily } from '@/physics/orbit-catalog';
import { Link } from '@/i18n/routing';
import { GALLERY_SORTS, galleryHref, type GalleryQuery } from '../model/gallery-query';
import styles from './gallery.module.css';

// Plain links: the state lives in the URL, so Back, sharing and reloads all keep it.
export function GalleryControls({ query }: { query: GalleryQuery }) {
  const t = useTranslations('orbits');
  const id = useId();
  const familyLabel = (family: OrbitFamily | undefined) => {
    if (!family) return t('filters.all');
    return family === 'analytic' ? t('filters.analytic') : family;
  };
  return (
    <nav className={styles.controls} aria-label={t('filters.label')}>
      <div className={styles.controlGroup} role="group" aria-labelledby={`${id}-class`}>
        <span id={`${id}-class`} className={styles.controlLabel}>
          {t('filters.class')}
        </span>
        {[undefined, ...ORBIT_FAMILIES].map((family) => (
          <Link
            key={family ?? 'all'}
            href={galleryHref({ ...query, family })}
            replace
            scroll={false}
            aria-current={query.family === family ? 'true' : undefined}
          >
            {familyLabel(family)}
          </Link>
        ))}
      </div>
      <div className={styles.controlGroup} role="group" aria-labelledby={`${id}-sort`}>
        <span id={`${id}-sort`} className={styles.controlLabel}>
          {t('filters.sort')}
        </span>
        {GALLERY_SORTS.map((sort) => (
          <Link
            key={sort}
            href={galleryHref({ ...query, sort })}
            replace
            scroll={false}
            aria-current={query.sort === sort ? 'true' : undefined}
          >
            {t(`filters.${sort}`)}
          </Link>
        ))}
      </div>
      <p className={styles.controlHelp}>{t('classHelp')}</p>
    </nav>
  );
}
