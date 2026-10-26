'use client';

import { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { OrbitDefinition, Trajectory } from '@/physics/types';
import { useExperienceMemory } from '@/components/providers';
import { PlaybackController } from './playback';
import { PlayerControls, ViewControls } from './player-controls';

const OrbitScene = dynamic(() => import('@/visualization/orbit-scene'), { ssr: false });
const trajectorySchema = z.object({
  version: z.literal(1),
  slug: z.string(),
  period: z.number().positive(),
  samples: z
    .array(
      z.object({ time: z.number().nonnegative(), state: z.array(z.number().finite()).length(12) }),
    )
    .min(2),
});

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Viewport({
  trajectory,
  controller,
  slug,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  slug: string;
}) {
  const t = useTranslations('player');
  const common = useTranslations('common');
  const [lost, setLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visible, setVisible] = useState(true);
  const onLost = useCallback(() => setLost(true), []);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const fallback = (
    <div className="scene-fallback">
      <Image src={`/previews/${slug}.svg`} width={640} height={400} alt="" />
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
  const memory = useExperienceMemory();
  const [controller] = useState(
    () => new PlaybackController(orbit.period, memory.getOrbit(orbit.slug)),
  );
  const [resource, setResource] = useState<{ data?: Trajectory; error?: boolean }>({});
  const t = useTranslations('player');
  useEffect(() => {
    const persist = () => memory.saveOrbit(orbit.slug, controller.export());
    persist();
    return controller.subscribe(persist);
  }, [memory, orbit.slug, controller]);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/orbits/${orbit.slug}.json`, { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Trajectory unavailable.');
        const data = trajectorySchema.parse(await response.json());
        if (data.slug !== orbit.slug || data.period !== orbit.period)
          throw new Error('Trajectory manifest mismatch.');
        setResource({ data });
      })
      .catch(() => {
        if (!abort.signal.aborted) setResource({ error: true });
      });
    return () => {
      abort.abort();
      memory.saveOrbit(orbit.slug, controller.export());
    };
  }, [orbit.slug, orbit.period, memory, controller]);
  return (
    <div className="orbit-visualization">
      <ViewControls controller={controller} />
      {resource.data ? (
        <Viewport trajectory={resource.data} controller={controller} slug={orbit.slug} />
      ) : (
        <div className="scene-fallback" role="status">
          <Image src={`/previews/${orbit.slug}.svg`} width={640} height={400} alt="" />
          <p>{t(resource.error ? 'error' : 'loading')}</p>
        </div>
      )}
      {resource.data ? <PlayerControls controller={controller} /> : null}
    </div>
  );
}
