import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CHAPTERS, chapterCapsules, type Capsule } from '../model/capsules';
import { openCapsule } from './use-capsule-hash';
import styles from './chapter-rail.module.css';

export const TUTOR_ANCHOR = 'tutor';
// Space left before the open chapter when the row scrolls to it.
const RAIL_INSET_PX = 8;

// Chapters with how far the learner is in each; a chapter link opens its first capsule.
export function ChapterRail({ deck, current }: { deck: readonly Capsule[]; current: Capsule }) {
  const t = useTranslations('learn.chapters');
  const currentChapter = CHAPTERS.indexOf(current.chapter);
  const currentLink = useRef<HTMLAnchorElement>(null);
  // On phones the row scrolls sideways; keep the open chapter in sight without moving the page.
  useEffect(() => {
    const link = currentLink.current;
    const row = link?.closest('ol');
    if (link && row) row.scrollTo({ left: link.offsetLeft - RAIL_INSET_PX });
  }, [currentChapter]);
  return (
    <nav className={styles.rail} aria-label={t('label')}>
      <ol>
        {CHAPTERS.map((chapter, index) => {
          const capsules = chapterCapsules(deck, chapter);
          const first = capsules[0];
          const seen =
            index < currentChapter
              ? capsules.length
              : index === currentChapter
                ? capsules.indexOf(current) + 1
                : 0;
          return (
            <li key={chapter}>
              <a
                ref={index === currentChapter ? currentLink : undefined}
                href={`#${first?.id ?? chapter}`}
                aria-current={index === currentChapter ? 'step' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  if (first && first.chapter !== current.chapter) openCapsule(first.id, 'push');
                }}
              >
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.name}>
                  {t(chapter)}
                  <span className={styles.meter} aria-hidden="true">
                    {capsules.map((capsule, position) => (
                      <i key={capsule.id} data-seen={position < seen || undefined} />
                    ))}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <a
        className={styles.tutor}
        href={`#${TUTOR_ANCHOR}`}
        onClick={(event) => {
          // The hash belongs to the deck, so the tutor is reached by moving the focus to it.
          event.preventDefault();
          document.getElementById(TUTOR_ANCHOR)?.focus();
        }}
      >
        {t('askTutor')}
      </a>
    </nav>
  );
}
