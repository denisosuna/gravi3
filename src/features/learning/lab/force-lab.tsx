import { Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { SceneBoundary } from '@/components/scene/scene-boundary';
import { UNITS, type Experiment } from '@/data/experiment';
import { ForceDiagram } from './force-diagram';
import styles from '../learning.module.css';

const ForceLabScene = dynamic(() => import('./force-lab-scene'), {
  ssr: false,
  loading: () => null,
});

function animationButtonKey(
  reducedMotion: boolean,
  staticPull: boolean,
  animating: boolean,
  hasCompletedCurrentSetup: boolean,
) {
  if (reducedMotion) return staticPull ? 'resetFall' : 'showFall';
  if (animating) return 'animationInProgress';
  return hasCompletedCurrentSetup ? 'replayFall' : 'showFall';
}

function animationStatusKey(
  lost: boolean,
  animating: boolean,
  staticPull: boolean,
  hasCompletedCurrentSetup: boolean,
) {
  if (lost) return 'animationUnavailable';
  if (animating) return 'animationPlaying';
  if (staticPull) return 'animationStatic';
  return hasCompletedCurrentSetup ? 'animationDone' : 'animationExplanation';
}

function formatSimulationTime(seconds: number, locale: string) {
  const days = seconds / 86_400;
  if (days >= 1) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'day',
      unitDisplay: 'long',
      maximumFractionDigits: 0,
    }).format(days);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
    maximumFractionDigits: 0,
  }).format(seconds / 3_600);
}

// 3D view of the experiment; the SVG diagram stands in while loading or without WebGL.
export function ForceLab({ experiment, force }: { experiment: Experiment; force: number }) {
  const t = useTranslations('learn');
  const common = useTranslations('common');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const [lost, setLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [animationRun, setAnimationRun] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [staticPull, setStaticPull] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    setupKey: string;
    seconds: number;
  } | null>(null);
  const setupKey = JSON.stringify([experiment.mass1, experiment.mass2, experiment.distance]);
  const onContextLost = useCallback(() => setLost(true), []);
  const onAnimationComplete = useCallback(
    (seconds: number) => {
      setSimulationResult({ setupKey, seconds });
      setAnimating(false);
    },
    [setupKey],
  );
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);
  const startFall = () => {
    if (reducedMotion) {
      setSimulationResult(null);
      setStaticPull((value) => !value);
      return;
    }
    setStaticPull(false);
    setSimulationResult(null);
    setAnimating(true);
    setAnimationRun((value) => value + 1);
  };
  const resultForCurrentSetup = simulationResult?.setupKey === setupKey ? simulationResult : null;
  const statusKey = animationStatusKey(lost, animating, staticPull, resultForCurrentSetup !== null);
  const status =
    statusKey === 'animationStatic' && resultForCurrentSetup === null
      ? t('animationStaticPending')
      : resultForCurrentSetup === null
        ? t(statusKey)
        : t(statusKey, { time: formatSimulationTime(resultForCurrentSetup.seconds, locale) });
  const fallback = (
    <div className="lab-fallback">
      <ForceDiagram experiment={experiment} force={force} />
      <p>{t('fallback3d')}</p>
      <button
        className="button"
        onClick={() => {
          setLost(false);
          setAttempt((value) => value + 1);
        }}
      >
        {common('retry')}
      </button>
    </div>
  );
  return (
    <figure className="force-lab">
      <div className="lab-scene" data-testid="force-lab-scene">
        {lost ? (
          fallback
        ) : (
          <SceneBoundary key={attempt} fallback={fallback}>
            <ForceLabScene
              experiment={experiment}
              force={force}
              animationRun={animationRun}
              animating={animating}
              staticPull={staticPull}
              onAnimationComplete={onAnimationComplete}
              onContextLost={onContextLost}
            />
          </SceneBoundary>
        )}
      </div>
      <div className={styles.animation}>
        <button
          className={`button ${styles.animationButton}`}
          type="button"
          disabled={lost || animating}
          aria-pressed={reducedMotion ? staticPull : undefined}
          onClick={startFall}
        >
          {reducedMotion && staticPull ? (
            <RotateCcw size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}
          {t(
            animationButtonKey(
              reducedMotion,
              staticPull,
              animating,
              resultForCurrentSetup !== null,
            ),
          )}
        </button>
        <p className={styles.animationStatus} aria-live="polite">
          {status}
        </p>
      </div>
      <ul className="lab-legend" aria-label={t('legend')}>
        <li className="legend-body-1">
          m₁ = {number.format(experiment.mass1)} {UNITS.mass}
        </li>
        <li className="legend-body-2">
          m₂ = {number.format(experiment.mass2)} {UNITS.mass}
        </li>
        <li className="legend-distance">
          r = {number.format(experiment.distance)} {UNITS.distance}
        </li>
      </ul>
      <figcaption>
        {t('scale')} <span className="lab-hint">{t('rotateHint')}</span>
      </figcaption>
    </figure>
  );
}
