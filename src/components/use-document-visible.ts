import { useSyncExternalStore } from 'react';

function subscribe(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

// Lets animated scenes stop rendering while the tab is hidden.
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !document.hidden,
    () => true,
  );
}
