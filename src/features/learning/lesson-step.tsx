import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LEARN_STEPS, type LearnStep } from './learn-steps';
import styles from './learning.module.css';

export function LessonStep({
  step,
  title,
  action,
  children,
}: {
  step: LearnStep;
  title: string;
  // An optional control shown beside the title, such as a reset button.
  action?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('learn');
  return (
    <section id={step} className={styles.step} aria-labelledby={`${step}-title`}>
      <header className={styles.stepHeader}>
        <div>
          <p className={styles.kicker}>
            {t('stepOf', { step: LEARN_STEPS.indexOf(step) + 1, total: LEARN_STEPS.length })}
          </p>
          <h2 id={`${step}-title`}>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
