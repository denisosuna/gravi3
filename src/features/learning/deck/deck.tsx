'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ROUTES } from '@/shared/constants/routes';
import {
  CHAPTERS,
  chapterCapsules,
  discoveriesBefore,
  neighbours,
  type Capsule,
} from '../model/capsules';
import { CapsuleFrame } from './capsule-frame';
import { openCapsule } from './use-capsule-hash';
import { useDeckGestures } from './use-deck-gestures';
import styles from './deck.module.css';

// Moving inside a chapter replaces the history entry; crossing chapters adds one, so Back returns.
function goToCapsule(from: Capsule, to: Capsule) {
  openCapsule(to.id, from.chapter === to.chapter ? 'replace' : 'push');
}

export function Deck({
  deck,
  current,
  children,
}: {
  deck: readonly Capsule[];
  current: Capsule;
  children: ReactNode;
}) {
  const t = useTranslations('learn.deck');
  const capsules = useTranslations('learn.capsules');
  const chapters = useTranslations('learn.chapters');
  const heading = useRef<HTMLHeadingElement>(null);
  const opened = useRef(current.id);
  const { previous, next } = neighbours(deck, current);
  const siblings = chapterCapsules(deck, current.chapter);
  const position = siblings.indexOf(current) + 1;
  const recap = discoveriesBefore(deck, current);
  const gestures = useDeckGestures(
    () => previous && goToCapsule(current, previous),
    () => next && goToCapsule(current, next),
  );

  // A new capsule takes the focus, so keyboard and screen reader users start at its title.
  useEffect(() => {
    if (opened.current === current.id) return;
    opened.current = current.id;
    heading.current?.focus();
  }, [current.id]);

  return (
    <div className={styles.deck} {...gestures}>
      <header className={styles.header}>
        <p className={styles.kicker}>
          {t('chapterOf', {
            number: CHAPTERS.indexOf(current.chapter) + 1,
            name: chapters(current.chapter),
          })}
        </p>
        <ol className={styles.dots} aria-label={t('capsulesLabel')}>
          {siblings.map((capsule, index) => (
            <li key={capsule.id}>
              <button
                type="button"
                aria-label={t('goTo', {
                  number: index + 1,
                  title: capsules(`${capsule.id}.title`),
                })}
                aria-current={capsule === current ? 'step' : undefined}
                onClick={() => goToCapsule(current, capsule)}
              />
            </li>
          ))}
        </ol>
      </header>
      <CapsuleFrame key={current.id} capsule={current} headingRef={heading}>
        {children}
      </CapsuleFrame>
      {recap.length > 0 ? (
        <section className={styles.recap} aria-labelledby="deck-recap">
          <h3 id="deck-recap">{t('discoveries')}</h3>
          <ul>
            {recap.map((capsule) => (
              <li key={capsule.id}>{capsules(`${capsule.id}.discovery`)}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <nav className={styles.nav} aria-label={t('navigation')}>
        <button
          type="button"
          className="button"
          disabled={!previous}
          onClick={() => previous && goToCapsule(current, previous)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t('previous')}
        </button>
        <p className={styles.progress} aria-live="polite">
          {t('progress', { current: position, total: siblings.length })}
        </p>
        {next ? (
          <button
            type="button"
            className="button primary"
            onClick={() => goToCapsule(current, next)}
          >
            {t('next')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <Link href={ROUTES.orbits} className="button primary">
            {t('finish')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  );
}
