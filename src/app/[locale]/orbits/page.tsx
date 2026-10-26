import { pageMetadata } from '@/server/metadata';
import { getTranslations } from 'next-intl/server';
import { Gallery } from '@/features/orbits/gallery';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return pageMetadata(locale, '/orbits', t('orbitsTitle'), t('description'));
}

export default async function OrbitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orbits' });
  return (
    <main id="main" className="gallery-page">
      <div className="eyebrow">{t('eyebrow')}</div>
      <div className="page-heading">
        <h1>{t('title')}</h1>
        <span className="count-pill">6 {t('solutions')}</span>
      </div>
      <p className="page-description">{t('description')}</p>
      <Gallery />
      <p className="gallery-note">{t('note')}</p>
    </main>
  );
}
