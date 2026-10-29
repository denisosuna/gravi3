import { useTranslations } from 'next-intl';
import { ArrowRight, Gauge, Layers, MoveUpRight, Orbit } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import { Link } from '@/i18n/routing';
import { HeroOrbit } from './hero-orbit';
import styles from './home-capsules.module.css';

const MILESTONES = ['two', 'three', 'periodic'] as const;
const STEPS = [
  { key: 'calibrate', icon: Gauge },
  { key: 'capsules', icon: Layers },
  { key: 'gallery', icon: Orbit },
] as const;

// The figure-eight only mounts while its capsule is open, so a hidden slide never animates.
export function QuestionSlide({ active }: { active: boolean }) {
  const t = useTranslations('home');
  return (
    <div className={styles.question}>
      <div className={styles.copy}>
        <p className={styles.body}>{t('capsules.question.body')}</p>
        <Link href={ROUTES.learn} className="button primary">
          {t('start')}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <figure className="home-visual">
        {active ? <HeroOrbit slug="figure-eight" width={560} height={330} /> : null}
        <figcaption>{t('visualCaption')}</figcaption>
      </figure>
    </div>
  );
}

export function WhySlide() {
  const t = useTranslations('home');
  const common = useTranslations('learn.deck');
  return (
    <>
      <p className={styles.body}>{t('capsules.why.body')}</p>
      <ol className={styles.milestones} aria-label={t('milestonesLabel')}>
        {MILESTONES.map((milestone) => (
          <li key={milestone}>
            <span>{t(`milestones.${milestone}.year`)}</span>
            <h3>{t(`milestones.${milestone}.title`)}</h3>
          </li>
        ))}
      </ol>
      <details className={styles.more}>
        <summary>{common('more')}</summary>
        <p>{t('problemIntro')}</p>
        {MILESTONES.map((milestone) => (
          <p key={milestone}>{t(`milestones.${milestone}.text`)}</p>
        ))}
      </details>
    </>
  );
}

export function HowSlide() {
  const t = useTranslations('home');
  return (
    <>
      <p className={styles.body}>{t('capsules.how.body')}</p>
      <ol className={styles.steps}>
        {STEPS.map(({ key, icon: Icon }) => (
          <li key={key}>
            <Icon size={20} aria-hidden="true" />
            {t(`capsules.how.steps.${key}`)}
          </li>
        ))}
      </ol>
      <div className="hero-actions">
        <Link href={ROUTES.calibration} className="button primary">
          {t('startCalibration')}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link href={ROUTES.orbits} className="button">
          {t('explore')}
          <MoveUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
