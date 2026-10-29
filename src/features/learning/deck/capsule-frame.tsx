import type { ReactNode, Ref } from 'react';
import { useTranslations } from 'next-intl';
import type { Capsule } from '../model/capsules';
import styles from './deck.module.css';

// One idea per screen: a title, a short text, the interaction, and the long version on request.
export function CapsuleFrame({
  capsule,
  headingRef,
  children,
}: {
  capsule: Capsule;
  headingRef: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  const t = useTranslations('learn.capsules');
  const deck = useTranslations('learn.deck');
  const titleId = `capsule-${capsule.id}-title`;
  return (
    <section id={`capsule-${capsule.id}`} className={styles.capsule} aria-labelledby={titleId}>
      <h2 id={titleId} ref={headingRef} tabIndex={-1}>
        {t(`${capsule.id}.title`)}
      </h2>
      <p className={styles.body}>{t(`${capsule.id}.body`)}</p>
      {children}
      {t.has(`${capsule.id}.more`) ? (
        <details className={styles.more}>
          <summary>{deck('more')}</summary>
          <p>{t(`${capsule.id}.more`)}</p>
        </details>
      ) : null}
    </section>
  );
}
