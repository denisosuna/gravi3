import { useTranslations } from 'next-intl';
import { ArrowRight, Atom, Orbit, Sparkles, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/routing';

const STEPS: readonly { key: 'learn' | 'tutor' | 'orbits'; href: string; icon: LucideIcon }[] = [
  { key: 'learn', href: ROUTES.learn, icon: Atom },
  { key: 'tutor', href: ROUTES.learn, icon: Sparkles },
  { key: 'orbits', href: ROUTES.orbits, icon: Orbit },
];

export function LearningPath() {
  const t = useTranslations('home');
  return (
    <section className="home-section" aria-labelledby="path-title">
      <h2 id="path-title">{t('pathTitle')}</h2>
      <ol className="learning-path">
        {STEPS.map(({ key, href, icon: Icon }, index) => (
          <li key={key} className="path-step">
            <span className="path-number" aria-hidden="true">
              {index + 1}
            </span>
            <Icon className="path-icon" size={22} aria-hidden="true" />
            <h3>{t(`steps.${key}.title`)}</h3>
            <p>{t(`steps.${key}.text`)}</p>
            <Link href={href} className="path-link">
              {t(`steps.${key}.cta`)}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
