import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, MoveUpRight, Orbit } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return (
    <main id="main" className="home-page">
      <div className="eyebrow">
        <span className="status-dot" />
        {t('eyebrow')}
      </div>
      <h1>
        {t('title')}
        <span>{t('accent')}</span>
      </h1>
      <p className="hero-copy">{t('description')}</p>
      <div className="hero-actions">
        <Link href="/learn" className="button primary">
          {t('start')}
          <ArrowRight size={18} />
        </Link>
        <Link href="/orbits" className="button">
          {t('explore')}
          <MoveUpRight size={18} />
        </Link>
      </div>
      <div className="home-visual" aria-hidden="true">
        <Image src="/previews/figure-eight.svg" alt="" width={650} height={380} />
        <Orbit className="home-orbit-icon" />
      </div>
      <div className="home-facts">
        <span>01 — {t('fact1')}</span>
        <span>02 — {t('fact2')}</span>
        <span>03 — {t('fact3')}</span>
      </div>
    </main>
  );
}
