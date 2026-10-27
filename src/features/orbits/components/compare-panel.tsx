import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';
import { OrbitTrace } from '@/shared/three/orbit-trace';
import { orbitFor } from '@/physics/orbit-catalog';
import { Link } from '@/i18n/routing';
import { galleryHref, toggleCompared, type GalleryQuery } from '../model/gallery-query';
import styles from './gallery.module.css';

const SECONDS_PER_PERIOD = 10;
const PUBLISH_INTERVAL_MS = 150;
const PHASE_STEP = 0.005;
const MIN_TO_COMPARE = 2;

// One clock for every compared orbit: each shows the same fraction of its own period.
class PhaseClock {
  private origin = 0;
  private offset = 0;
  private running = false;

  phase = (now: number) =>
    this.running
      ? (this.offset + (now - this.origin) / 1000 / SECONDS_PER_PERIOD) % 1
      : this.offset;

  setRunning(running: boolean, now: number) {
    this.offset = this.phase(now);
    this.origin = now;
    this.running = running;
  }

  seek(fraction: number, now: number) {
    this.offset = fraction;
    this.origin = now;
  }
}

export function ComparePanel({ query }: { query: GalleryQuery }) {
  const t = useTranslations('orbits');
  const player = useTranslations('player');
  const locale = useLocale();
  const [clock] = useState(() => new PhaseClock());
  const [playing, setPlaying] = useState(false);
  const [fraction, setFraction] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setFraction(clock.phase(performance.now())),
      PUBLISH_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [clock, playing]);
  if (query.compare.length === 0) return null;
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  const period = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  function toggle() {
    clock.setRunning(!playing, performance.now());
    setPlaying(!playing);
  }
  return (
    <section className={styles.compare} aria-labelledby="compare-title">
      <h2 id="compare-title">{t('compare.title')}</h2>
      <p className={styles.compareExplain}>{t('compare.explain')}</p>
      {query.compare.length < MIN_TO_COMPARE ? <p>{t('compare.pickMore')}</p> : null}
      <ul className={styles.compareGrid}>
        {query.compare.map((slug) => {
          const name = t(`${slug}.name`);
          return (
            <li key={slug} className={styles.compareItem}>
              <OrbitTrace slug={slug} width={320} height={200} phase={clock.phase} />
              <p>
                <strong>{name}</strong>{' '}
                <span className={styles.number}>T = {period.format(orbitFor(slug).period)}</span>
              </p>
              <Link href={galleryHref(toggleCompared(query, slug))} replace scroll={false}>
                {t('compare.remove', { name })}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.compareControls}>
        <button type="button" className="control-button" onClick={toggle}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          <span>{player(playing ? 'pause' : 'play')}</span>
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={PHASE_STEP}
          value={fraction}
          aria-label={t('compare.phase')}
          aria-valuetext={percent.format(fraction)}
          onChange={(event) => {
            const value = Number(event.target.value);
            clock.seek(value, performance.now());
            setFraction(value);
          }}
        />
        <output className={styles.number}>{percent.format(fraction)}</output>
      </div>
    </section>
  );
}
