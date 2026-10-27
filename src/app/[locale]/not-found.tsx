import { useTranslations } from 'next-intl';
import { ROUTES } from '@/shared/constants/routes';
import { Link } from '@/i18n/routing';

// Shown for unknown orbit slugs and unmatched localized paths, in the visitor's language.
export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <main id="main" className="status-page">
      <h1>{t('notFoundTitle')}</h1>
      <p>{t('notFoundText')}</p>
      <nav aria-label={t('suggestions')} className="status-actions">
        <Link href={ROUTES.orbits} className="button primary">
          {t('toOrbits')}
        </Link>
        <Link href={ROUTES.learn} className="button">
          {t('toLearn')}
        </Link>
      </nav>
    </main>
  );
}
