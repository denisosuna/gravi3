import { useEffect, useSyncExternalStore } from 'react';

// The URL hash names the open capsule, so any capsule can be linked and Back works between chapters.
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}

function readHash() {
  const hash = window.location.hash.slice(1);
  try {
    return decodeURIComponent(hash);
  } catch {
    // A malformed escape such as "#50%" names no capsule; the deck then opens at its start.
    return hash;
  }
}

export type HistoryMode = 'push' | 'replace';

// Next.js integrates native history calls into its router; neither call fires `hashchange`.
export function openCapsule(id: string, mode: HistoryMode) {
  const url = `#${encodeURIComponent(id)}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  notify();
}

export function useCapsuleHash(): string {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  // A client navigation from another page writes the URL after rendering; read it again once mounted.
  useEffect(notify, []);
  return hash;
}
