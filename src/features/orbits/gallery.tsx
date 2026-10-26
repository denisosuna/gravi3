'use client';

import Image from 'next/image';
import { useLayoutEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { ASSETS, ROUTES } from '@/constants/routes';
import { orbits } from '@/data/orbits';
import { Link } from '@/i18n/routing';
import { useExperienceMemory } from '@/components/providers';

const cardId = (slug: string) => `orbit-${slug}`;

export function Gallery() {
  const t = useTranslations('orbits');
  const memory = useExperienceMemory();
  const gallery = memory.gallery;
  useLayoutEffect(() => {
    window.scrollTo(0, gallery.scroll);
    if (gallery.restoreFocus && gallery.selected) {
      document.getElementById(cardId(gallery.selected))?.focus({ preventScroll: true });
      memory.updateGallery({ restoreFocus: false });
    }
  }, [gallery, memory]);
  return (
    <div className="gallery-grid">
      {orbits.map((orbit, index) => (
        <Link
          href={ROUTES.orbit(orbit.slug)}
          key={orbit.slug}
          id={cardId(orbit.slug)}
          className={`gallery-card ${gallery.selected === orbit.slug ? 'was-selected' : ''}`}
          onClick={() => {
            memory.updateGallery({
              scroll: window.scrollY,
              selected: orbit.slug,
              restoreFocus: true,
            });
          }}
        >
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
          <ArrowUpRight className="card-arrow" size={19} />
          <div className="gallery-preview">
            <Image src={ASSETS.orbitPreview(orbit.slug)} alt="" width={256} height={224} />
          </div>
          <h2>{t(`${orbit.slug}.name`)}</h2>
          <p>{t(`${orbit.slug}.subtitle`)}</p>
          <span className="card-tag">{t('periodic')}</span>
        </Link>
      ))}
    </div>
  );
}
