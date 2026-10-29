'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useDeckGestures } from '@/shared/ui/use-deck-gestures';
import { HowSlide, QuestionSlide, WhySlide } from './home-slides';
import styles from './home-capsules.module.css';

const SLIDES = ['question', 'why', 'how'] as const;

// Three capsules instead of a long page; every capsule is in the HTML, one is shown at a time.
export function HomeCapsules() {
  const t = useTranslations('home');
  const [index, setIndex] = useState(0);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);
  const shown = useRef(index);
  const go = (next: number) => setIndex(Math.min(SLIDES.length - 1, Math.max(0, next)));
  const gestures = useDeckGestures(
    () => go(index - 1),
    () => go(index + 1),
  );

  // Moving between capsules takes the focus to the new title; the first load leaves it alone.
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    headings.current[index]?.focus();
  }, [index]);

  return (
    <section className={styles.deck} aria-label={t('deck.label')} {...gestures}>
      {SLIDES.map((slide, position) => (
        <section
          key={slide}
          className={styles.slide}
          aria-labelledby={`home-${slide}`}
          hidden={position !== index}
        >
          <h2
            id={`home-${slide}`}
            ref={(heading) => {
              headings.current[position] = heading;
            }}
            tabIndex={-1}
          >
            {t(`capsules.${slide}.title`)}
          </h2>
          {slide === 'question' ? <QuestionSlide active={index === 0} /> : null}
          {slide === 'why' ? <WhySlide /> : null}
          {slide === 'how' ? <HowSlide /> : null}
        </section>
      ))}
      <nav className={styles.nav} aria-label={t('deck.label')}>
        <button
          type="button"
          className="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className={styles.navLabel}>{t('deck.previous')}</span>
        </button>
        <ol className={styles.dots}>
          {SLIDES.map((slide, position) => (
            <li key={slide}>
              <button
                type="button"
                aria-label={t('deck.goTo', {
                  number: position + 1,
                  title: t(`capsules.${slide}.title`),
                })}
                aria-current={position === index ? 'step' : undefined}
                onClick={() => go(position)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="button primary"
          disabled={index === SLIDES.length - 1}
          onClick={() => go(index + 1)}
        >
          <span className={styles.navLabel}>{t('deck.next')}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </section>
  );
}
