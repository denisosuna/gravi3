import { useTranslations } from 'next-intl';

const MILESTONES = ['two', 'three', 'periodic'] as const;

export function ProblemSection() {
  const t = useTranslations('home');
  return (
    <section className="home-section" aria-labelledby="problem-title">
      <h2 id="problem-title">{t('problemTitle')}</h2>
      <p className="section-intro">{t('problemIntro')}</p>
      <ol className="milestones">
        {MILESTONES.map((milestone) => (
          <li key={milestone} className="milestone-card">
            <span className="milestone-year">{t(`milestones.${milestone}.year`)}</span>
            <h3>{t(`milestones.${milestone}.title`)}</h3>
            <p>{t(`milestones.${milestone}.text`)}</p>
          </li>
        ))}
      </ol>
      <aside className="why-panel" aria-labelledby="why-title">
        <h3 id="why-title">{t('whyTitle')}</h3>
        <p>{t('whyText')}</p>
      </aside>
    </section>
  );
}
