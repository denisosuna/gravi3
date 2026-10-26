import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ASSETS, ROUTES } from '@/constants/routes';
import { orbits } from '@/data/orbits';
import { Link } from '@/i18n/routing';
import type { OrbitSlug } from '@/physics/types';

export function OrbitLibrary({ selected }: { selected: OrbitSlug }) {
  const t = useTranslations('orbits');
  return (
    <aside className="orbit-library" aria-label={t('library')}>
      <div className="library-label">
        {t('library')}
        <span>{String(orbits.length).padStart(2, '0')}</span>
      </div>
      <div className="library-list">
        {orbits.map((orbit) => (
          <Link
            key={orbit.slug}
            href={ROUTES.orbit(orbit.slug)}
            className={`library-card ${selected === orbit.slug ? 'selected' : ''}`}
            aria-current={selected === orbit.slug ? 'page' : undefined}
          >
            <Image src={ASSETS.orbitPreview(orbit.slug)} alt="" width={104} height={92} />
            <span>
              <strong>{t(`${orbit.slug}.name`)}</strong>
              <small>{t(`${orbit.slug}.subtitle`)}</small>
            </span>
          </Link>
        ))}
      </div>
      <p className="library-footnote">{t('libraryNote')}</p>
    </aside>
  );
}
