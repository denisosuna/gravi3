import { ROUTES } from '@/shared/constants/routes';
import { sectionMetadata } from '@/server/metadata';
import { getTranslations } from 'next-intl/server';
import { LearningExperience } from '@/features/learning/components/learning-experience';
import { findOrbit } from '@/physics/orbit-catalog';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.learn, 'learnTitle');
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orbit?: string | string[] }>;
}) {
  const { locale } = await params;
  const { orbit } = await searchParams;
  // Only a gallery orbit can start the simulator; anything else is ignored.
  const startOrbit = typeof orbit === 'string' ? findOrbit(orbit)?.slug : undefined;
  const t = await getTranslations({ locale, namespace: 'learn' });
  return (
    <main id="main" className="learning-page">
      <h1>{t('title')}</h1>
      <p className="page-description">{t('description')}</p>
      <LearningExperience startOrbit={startOrbit} />
    </main>
  );
}
