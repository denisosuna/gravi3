import { useTranslations } from 'next-intl';
import { ArrowRight, MoveUpRight } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Link } from '@/i18n/routing';
import { OrbitTrace } from '@/shared/three/orbit-trace';

export function HomeHero() {
  const t = useTranslations('home');
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <h1 id="home-title">{t('title')}</h1>
        <p className="hero-copy">{t('lead')}</p>
        <div className="hero-actions">
          <Link href={ROUTES.learn} className="button primary">
            {t('start')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href={ROUTES.orbits} className="button">
            {t('explore')}
            <MoveUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <figure className="home-visual">
        <OrbitTrace slug="figure-eight" width={560} height={330} />
        <figcaption>{t('visualCaption')}</figcaption>
      </figure>
    </section>
  );
}
