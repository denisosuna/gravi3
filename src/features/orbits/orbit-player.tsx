'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ASSETS } from '@/constants/routes';
import { parseTrajectory } from '@/physics/trajectory-schema';
import type { OrbitDefinition, OrbitSlug, Trajectory } from '@/physics/types';
import { useExperienceMemory } from '@/components/providers';
import { SceneBoundary } from '@/components/scene-boundary';
import { useDocumentVisible } from '@/components/use-document-visible';
import { PlaybackController } from './playback';
import { PlayerControls, ViewControls } from './player-controls';

const OrbitScene = dynamic(() => import('@/visualization/orbit-scene'), { ssr: false });
function Viewport({
  trajectory,
  controller,
  slug,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  slug: OrbitSlug;
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
      aria-label={t('physicalTime')}
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

export function OrbitPlayer({ orbit }: { orbit: OrbitDefinition }) {
  const { slug, period } = orbit;
  const memory = useExperienceMemory();
  const [controller] = useState(() => new PlaybackController(period, memory.getOrbit(slug)));
  const [resource, setResource] = useState<{ data?: Trajectory; error?: boolean }>({});
  const t = useTranslations('player');
  useEffect(() => {
    const persist = () => memory.saveOrbit(slug, controller.export());
    persist();
    return controller.subscribe(persist);
  }, [memory, slug, controller]);
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
    return () => {
      abort.abort();
      memory.saveOrbit(slug, controller.export());
    };
  }, [slug, period, memory, controller]);
  return (
    <div className="orbit-visualization">
      <ViewControls controller={controller} />
      {resource.data ? (
        <Viewport trajectory={resource.data} controller={controller} slug={slug} />
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
