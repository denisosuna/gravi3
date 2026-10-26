import { useSyncExternalStore } from 'react';
import type { OrbitSession, PlaybackController } from './playback';

export function usePlaybackState(controller: PlaybackController): OrbitSession {
  return useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
}
