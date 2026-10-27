'use client';

import { createContext, useContext, useState } from 'react';
import { ThemeProvider } from 'next-themes';

export const THEMES = ['system', 'dark', 'light'] as const;
export const DEFAULT_THEME = 'system';

// Each feature declares the keys it stores, so this provider does not depend on any feature.
interface SessionKey<T> {
  readonly id: symbol;
  readonly initial: () => T;
}

export function createSessionKey<T>(description: string, initial: () => T): SessionKey<T> {
  return { id: Symbol(description), initial };
}

// Survives client navigation and locale changes; a reload starts fresh, as the brief allows.
class SessionMemory {
  private values = new Map<symbol, unknown>();

  get<T>(key: SessionKey<T>): T {
    if (!this.values.has(key.id)) this.values.set(key.id, key.initial());
    // The key's type parameter is the only way a value enters this entry.
    return this.values.get(key.id) as T;
  }

  set<T>(key: SessionKey<T>, value: T) {
    this.values.set(key.id, value);
  }
}

const MemoryContext = createContext<SessionMemory | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [memory] = useState(() => new SessionMemory());
  return (
    <ThemeProvider attribute="class" defaultTheme={DEFAULT_THEME} enableSystem>
      <MemoryContext.Provider value={memory}>{children}</MemoryContext.Provider>
    </ThemeProvider>
  );
}

export function useSessionMemory() {
  const memory = useContext(MemoryContext);
  if (!memory) throw new Error('Session memory provider is missing.');
  return memory;
}
