'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ASSETS } from '@/constants/routes';
import { parseTrajectory } from '@/physics/trajectory-schema';
import type { OrbitDefinition, OrbitSlug, Trajectory } from '@/physics/types';
import { SceneBoundary } from '@/components/scene/scene-boundary';
import { useDocumentVisible } from '@/components/scene/use-document-visible';
import { usePlaybackController } from './orbit-playback';
import type { PlaybackController } from './playback';
import { PlayerControls, ViewControls } from './player-controls';

const OrbitScene = dynamic(() => import('./scene/orbit-scene'), { ssr: false });
interface SceneLabels {
  label: string;
  // Id of the text that describes what the animation shows, for screen readers.
  descriptionId: string;
}

function Viewport({
  trajectory,
  controller,
  slug,
  labels,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  slug: OrbitSlug;
  labels: SceneLabels;
}) {
  const t = useTranslations('player');
  const common = useTranslations('common');
  const [lost, setLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visible = useDocumentVisible();
  const onLost = useCallback(() => setLost(true), []);
  const fallback = (
    <div className="scene-fallback">
      <Image src={ASSETS.orbitPreview(slug)} width={640} height={400} alt="" />
      <p>{t('fallback')}</p>
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
    <div
      className="scene-container"
      role="group"
      aria-label={labels.label}
      aria-describedby={labels.descriptionId}
      data-testid="orbit-scene"
    >
      {lost ? (
        fallback
      ) : (
        <SceneBoundary key={attempt} fallback={fallback}>
          <OrbitScene
            trajectory={trajectory}
            controller={controller}
            onLost={onLost}
            visible={visible}
          />
        </SceneBoundary>
      )}
      <div className="axis-label" aria-hidden="true">
        <span>y</span>
        <i />
        <span>x</span>
      </div>
    </div>
  );
}

export function OrbitPlayer({ orbit, labels }: { orbit: OrbitDefinition; labels: SceneLabels }) {
  const { slug, period } = orbit;
  const controller = usePlaybackController();
  const [resource, setResource] = useState<{ data?: Trajectory; error?: boolean }>({});
  const t = useTranslations('player');
  useEffect(() => {
    const abort = new AbortController();
    fetch(ASSETS.orbitTrajectory(slug), { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Trajectory unavailable.');
        setResource({ data: parseTrajectory(await response.json(), { slug, period }) });
      })
      .catch(() => {
        if (!abort.signal.aborted) setResource({ error: true });
      });
    return () => abort.abort();
  }, [slug, period]);
  return (
    <div className="orbit-visualization">
      <ViewControls controller={controller} />
      {resource.data ? (
        <Viewport trajectory={resource.data} controller={controller} slug={slug} labels={labels} />
      ) : (
        <div className="scene-fallback" role="status">
          <Image src={ASSETS.orbitPreview(slug)} width={640} height={400} alt="" />
          <p>{t(resource.error ? 'error' : 'loading')}</p>
        </div>
      )}
      {resource.data ? <PlayerControls controller={controller} /> : null}
    </div>
  );
}
