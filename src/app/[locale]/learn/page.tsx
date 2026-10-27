import { ROUTES } from '@/constants/routes';
import { sectionMetadata } from '@/server/metadata';
import { getTranslations } from 'next-intl/server';
import { LearningExperience } from '@/features/learning/learning-experience';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.learn, 'learnTitle');
}

export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'learn' });
  return (
    <main id="main" className="learning-page">
      <h1>{t('title')}</h1>
      <p className="page-description">{t('description')}</p>
      <LearningExperience />
    </main>
  );
}
