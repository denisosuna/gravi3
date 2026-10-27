import { useSyncExternalStore } from 'react';
import type { OrbitSession, PlaybackController } from './playback';

// Components subscribe to the fields they render so frequent time updates don't re-render the scene.
export function usePlaybackState<T>(
  controller: PlaybackController,
  select: (session: OrbitSession) => T,
): T {
  const read = () => select(controller.snapshot());
  return useSyncExternalStore(controller.subscribe, read, read);
}
