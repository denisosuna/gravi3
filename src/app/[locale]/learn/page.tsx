import { getTranslations } from 'next-intl/server';

export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'learn' });
  return (
    <main id="main" className="learning-page">
      <div className="eyebrow">{t('eyebrow')}</div>
      <h1>{t('title')}</h1>
      <p className="page-description">{t('description')}</p>
      <section className="formula-panel">
        <h2>{t('formulaTitle')}</h2>
        <p className="formula">F = G · m₁ · m₂ / r²</p>
        <p>{t('formulaText')}</p>
        <small>{t('constant')}</small>
      </section>
    </main>
  );
}
