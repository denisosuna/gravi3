import { ROUTES } from '@/shared/constants/routes';
import { getTranslations } from 'next-intl/server';
import { HomeCapsules } from '@/features/home/home-capsules';
import { sectionMetadata } from '@/server/metadata';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.home, 'homeTitle');
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return (
    <main id="main" className="home-page">
      <h1 className="home-title">{t('title')}</h1>
      <HomeCapsules />
    </main>
  );
}
