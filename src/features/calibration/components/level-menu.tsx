'use client';

import { useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Gauge } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import { useSessionMemory, useSessionValue } from '@/shared/ui/providers';
import { DEFAULT_LEVEL, LEVELS, type Level } from '../model/calibration';
import { LEVEL_SESSION } from '../model/level-session';
import styles from './level-menu.module.css';

// The learner's level as a header button; the choices open in a popover, out of the lesson's way.
export function LevelMenu() {
  const t = useTranslations('calibration.menu');
  const levels = useTranslations('calibration.levels');
  const memory = useSessionMemory();
  const { level: chosen } = useSessionValue(LEVEL_SESSION);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  if (usePathname() !== ROUTES.learn) return null;
  const level = chosen ?? DEFAULT_LEVEL;

  function choose(next: Level) {
    memory.set(LEVEL_SESSION, { level: next });
    panel.current?.hidePopover();
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget={id}
        aria-label={t('open', { level: levels(`${level}.name`) })}
        data-pending={chosen === null || undefined}
      >
        <Gauge size={18} aria-hidden="true" />
        <span className={styles.label} aria-hidden="true">
          {levels(`${level}.name`)}
        </span>
      </button>
      <div id={id} ref={panel} popover="auto" className={styles.panel}>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.note}>{chosen ? t('chosen') : t('pending')}</p>
        <ul className={styles.options}>
          {LEVELS.map((option) => (
            <li key={option}>
              <button type="button" aria-pressed={level === option} onClick={() => choose(option)}>
                <strong>{levels(`${option}.name`)}</strong>
                <small>{levels(`${option}.help`)}</small>
              </button>
            </li>
          ))}
        </ul>
        <Link
          href={ROUTES.calibration}
          className={chosen ? 'button' : 'button primary'}
          onClick={() => panel.current?.hidePopover()}
        >
          {t('calibrate')}
        </Link>
      </div>
    </>
  );
}
