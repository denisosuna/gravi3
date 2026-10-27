'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TutorAction } from '@/features/tutor/model/tutor-actions';
import type { OrbitDefinition, OrbitSlug } from '@/physics/types';
import { createSessionKey, useSessionMemory } from '@/shared/ui/providers';
import { TutorPanel } from '@/features/tutor/components/tutor-panel';
import { PlaybackController, type OrbitSession } from '../model/playback';

const ORBIT_SESSIONS = createSessionKey('orbit-sessions', () => new Map<OrbitSlug, OrbitSession>());
export const STAGE_ID = 'orbit-stage';

const PlaybackContext = createContext<PlaybackController | null>(null);

// Shares one playback controller between the player and the tutor, which sit in different columns.
export function OrbitPlaybackProvider({
  orbit,
  children,
}: {
  orbit: OrbitDefinition;
  children: ReactNode;
}) {
  const sessions = useSessionMemory().get(ORBIT_SESSIONS);
  const [controller] = useState(
    () => new PlaybackController(orbit.period, sessions.get(orbit.slug)),
  );
  useEffect(() => {
    const persist = () => sessions.set(orbit.slug, controller.export());
    persist();
    const unsubscribe = controller.subscribe(persist);
    return () => {
      unsubscribe();
      persist();
    };
  }, [sessions, orbit.slug, controller]);
  return <PlaybackContext.Provider value={controller}>{children}</PlaybackContext.Provider>;
}

export function usePlaybackController(): PlaybackController {
  const controller = useContext(PlaybackContext);
  if (!controller) throw new Error('Orbit playback provider is missing.');
  return controller;
}

function revealStage() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(STAGE_ID)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

// Runs a player action the learner accepted; the server already checked its type and range.
function applyOrbitAction(action: TutorAction, controller: PlaybackController) {
  if (action.type === 'seekOrbit') controller.update({ time: action.fraction * controller.period });
  else if (action.type === 'setOrbitSpeed') controller.update({ speed: action.speed });
  else return;
  revealStage();
}

export function OrbitTutor({ slug }: { slug: OrbitSlug }) {
  const controller = usePlaybackController();
  return (
    <TutorPanel
      context={{ kind: 'orbit', slug }}
      onAction={(action) => applyOrbitAction(action, controller)}
    />
  );
}
