'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ASSETS } from '@/shared/constants/routes';
import type { OrbitSlug } from '@/physics/types';
import { SceneBoundary } from '@/shared/three/scene-boundary';
import { useTrajectory } from '@/shared/three/orbit-trace';
import { useDocumentVisible } from '@/shared/three/use-document-visible';
import { useReducedMotion } from '@/shared/three/use-reduced-motion';

// Three.js loads only after the static preview, which stays the largest contentful paint.
const HeroOrbitScene = dynamic(() => import('./hero-orbit-scene'), { ssr: false });

export function HeroOrbit({
  slug,
  width,
  height,
}: {
  slug: OrbitSlug;
  width: number;
  height: number;
}) {
  const t = useTranslations('common');
  const trajectory = useTrajectory(slug);
  const visible = useDocumentVisible();
  // Until the visitor chooses, motion follows the reduced-motion setting.
  const [choice, setChoice] = useState<boolean | null>(null);
  const reducedMotion = useReducedMotion();
  const paused = choice ?? reducedMotion;
  // The preview is hidden only once WebGL is running, so a failure leaves it in place.
  const [ready, setReady] = useState(false);
  return (
    <div className="orbit-trace" data-ready={ready ? 'true' : undefined}>
      <Image src={ASSETS.orbitPreview(slug)} alt="" width={width} height={height} priority />
      {trajectory ? (
        <div className="hero-orbit-scene" aria-hidden="true">
          <SceneBoundary fallback={null}>
            <HeroOrbitScene
              trajectory={trajectory}
              paused={paused}
              visible={visible}
              onReady={() => setReady(true)}
            />
          </SceneBoundary>
        </div>
      ) : null}
      <button
        type="button"
        className="orbit-trace-toggle"
        aria-pressed={paused}
        aria-label={paused ? t('playAnimation') : t('pauseAnimation')}
        onClick={() => setChoice(!paused)}
      >
        {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
