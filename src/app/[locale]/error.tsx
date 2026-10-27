'use client';

import { useTranslations } from 'next-intl';

// Error boundaries must be client components; production errors carry no server details.
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('errors');
  const common = useTranslations('common');
  return (
    <main id="main" className="status-page">
      <h1>{t('errorTitle')}</h1>
      <p>{t('errorText')}</p>
      <div className="status-actions">
        <button className="button primary" onClick={retry}>
          {common('retry')}
        </button>
      </div>
    </main>
  );
}
