'use client';

import { useTranslations } from 'next-intl';
import { Gauge } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import { useSessionMemory } from '@/shared/ui/providers';
import { LEVEL_SESSION } from '@/features/calibration/model/level-session';
import styles from './calibration-banner.module.css';

// Invites a first calibration, or shows the level chosen in this session with a way to redo it.
export function CalibrationBanner() {
  const t = useTranslations('learn.calibration');
  const levels = useTranslations('calibration.levels');
  const { level } = useSessionMemory().get(LEVEL_SESSION);
  return (
    <aside className={styles.banner} aria-label={t('start')}>
      <Gauge size={22} aria-hidden="true" />
      <p>{level ? t('current', { level: levels(`${level}.name`) }) : t('prompt')}</p>
      <Link href={ROUTES.calibration} className={level ? 'button' : 'button primary'}>
        {level ? t('repeat') : t('start')}
      </Link>
    </aside>
  );
}
