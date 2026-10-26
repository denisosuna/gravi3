'use client';

import Image from 'next/image';
import { useLayoutEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { orbits } from '@/data/orbits';
import { Link } from '@/i18n/routing';
import { useExperienceMemory } from '@/components/providers';

export function Gallery() {
  const t = useTranslations('orbits');
  const memory = useExperienceMemory();
  const gallery = memory.gallery;
  useLayoutEffect(() => {
    window.scrollTo(0, gallery.scroll);
    if (gallery.restoreFocus && gallery.selected) {
      document.getElementById(`orbit-${gallery.selected}`)?.focus({ preventScroll: true });
      memory.updateGallery({ restoreFocus: false });
    }
  }, [gallery, memory]);
  return (
    <div className="gallery-grid">
      {orbits.map((orbit, index) => (
        <Link
          href={`/orbits/${orbit.slug}`}
          key={orbit.slug}
          id={`orbit-${orbit.slug}`}
          scroll={false}
          className={`gallery-card ${gallery.selected === orbit.slug ? 'was-selected' : ''}`}
          onClick={() => {
            memory.updateGallery({
              scroll: window.scrollY,
              selected: orbit.slug,
              restoreFocus: true,
            });
          }}
        >
          <span className="card-number">0{index + 1}</span>
          <ArrowUpRight className="card-arrow" size={19} />
          <div className="gallery-preview">
            <Image src={`/previews/${orbit.slug}.svg`} alt="" width={256} height={224} />
          </div>
          <h2>{t(`${orbit.slug}.name`)}</h2>
          <p>{t(`${orbit.slug}.subtitle`)}</p>
          <span className="card-tag">{t('periodic')}</span>
        </Link>
      ))}
    </div>
  );
}

export function OrbitLibrary({ selected }: { selected: string }) {
  const t = useTranslations('orbits');
  return (
    <aside className="orbit-library" aria-label={t('library')}>
      <div className="library-label">
        {t('library')}
        <span>06</span>
      </div>
      <div className="library-list">
        {orbits.map((orbit) => (
          <Link
            key={orbit.slug}
            href={`/orbits/${orbit.slug}`}
            scroll={false}
            className={`library-card ${selected === orbit.slug ? 'selected' : ''}`}
            aria-current={selected === orbit.slug ? 'page' : undefined}
          >
            <Image src={`/previews/${orbit.slug}.svg`} alt="" width={104} height={92} />
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
