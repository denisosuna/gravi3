import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LEARN_STEPS, TUTOR_ANCHOR, type LearnStep } from './learn-steps';
import styles from './learning.module.css';

// A step counts as current once its top passes the upper part of the viewport.
const ACTIVE_BAND = '-30% 0px -60% 0px';

function useCurrentStep(): LearnStep {
  const [current, setCurrent] = useState<LearnStep>(LEARN_STEPS[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        const step = LEARN_STEPS.find((id) => id === visible?.target.id);
        if (step) setCurrent(step);
      },
      { rootMargin: ACTIVE_BAND },
    );
    for (const id of LEARN_STEPS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);
  return current;
}

export function StepRail() {
  const t = useTranslations('learn.steps');
  const current = useCurrentStep();
  return (
    <nav className={styles.rail} aria-label={t('label')}>
      <ol>
        {LEARN_STEPS.map((step, index) => (
          <li key={step}>
            <a href={`#${step}`} aria-current={current === step ? 'step' : undefined}>
              <span className={styles.railNumber} aria-hidden="true">
                {index + 1}
              </span>
              {t(step)}
            </a>
          </li>
        ))}
      </ol>
      <a className={styles.railTutor} href={`#${TUTOR_ANCHOR}`}>
        {t('askTutor')}
      </a>
    </nav>
  );
}
