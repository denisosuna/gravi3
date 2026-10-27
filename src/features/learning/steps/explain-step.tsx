import { useTranslations } from 'next-intl';
import { LessonStep } from '../components/lesson-step';
import styles from '../components/learning.module.css';

export function ExplainStep() {
  const t = useTranslations('learn');
  return (
    <LessonStep step="explain" title={t('formulaTitle')}>
      <p className={styles.formula}>F = G · m₁ · m₂ / r²</p>
      <p className={styles.stepIntro}>{t('formulaText')}</p>
      <p className={styles.stepIntro}>{t('equal')}</p>
      <p className={styles.constant}>{t('constant')}</p>
    </LessonStep>
  );
}
