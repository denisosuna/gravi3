import { ROUTES } from '@/constants/routes';
import { sectionMetadata } from '@/server/metadata';
import { getTranslations } from 'next-intl/server';
import { Gallery } from '@/features/orbits/gallery';
import { parseGalleryQuery } from '@/features/orbits/gallery-query';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.orbits, 'orbitsTitle');
}

// Filters, order and comparison come from the URL, so Back, links and reloads keep them.
export default async function OrbitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: 'orbits' });
  return (
    <main id="main" className="gallery-page">
      <h1>{t('title')}</h1>
      <p className="page-description">{t('description')}</p>
      <Gallery query={parseGalleryQuery(search)} />
      <p className="gallery-note">{t('note')}</p>
    </main>
  );
}
