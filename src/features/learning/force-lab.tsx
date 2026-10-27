import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { SceneBoundary } from '@/components/scene-boundary';
import { UNITS, type Experiment } from '@/data/experiment';
import { ForceDiagram } from './force-diagram';

const ForceLabScene = dynamic(() => import('@/visualization/force-lab-scene'), {
  ssr: false,
  loading: () => null,
});

// 3D view of the experiment; the SVG diagram stands in while loading or without WebGL.
export function ForceLab({ experiment, force }: { experiment: Experiment; force: number }) {
  const t = useTranslations('learn');
  const common = useTranslations('common');
  const number = new Intl.NumberFormat(useLocale());
  const [lost, setLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const onContextLost = useCallback(() => setLost(true), []);
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
            <ForceLabScene experiment={experiment} force={force} onContextLost={onContextLost} />
          </SceneBoundary>
        )}
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
