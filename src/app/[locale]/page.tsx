import { ROUTES } from '@/shared/constants/routes';
import { HomeHero } from '@/features/home/home-hero';
import { LearningPath } from '@/features/home/learning-path';
import { ProblemSection } from '@/features/home/problem-section';
import { sectionMetadata } from '@/server/metadata';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.home, 'homeTitle');
}

export default function Home() {
  return (
    <main id="main" className="home-page">
      <HomeHero />
      <ProblemSection />
      <LearningPath />
    </main>
  );
}
