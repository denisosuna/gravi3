'use client';

import { createContext, useContext, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { initialExperiment, type Experiment } from '@/data/experiment';
import type { OrbitSession } from '@/features/orbits/playback';

export const THEMES = ['system', 'dark', 'light'] as const;
export const DEFAULT_THEME = 'system';

class ExperienceMemory {
  private sessions = new Map<string, OrbitSession>();
  private experiment: Experiment = { ...initialExperiment };
  getExperiment() {
    return this.experiment;
  }
  saveExperiment(experiment: Experiment) {
    this.experiment = { ...experiment };
  }
  gallery: { scroll: number; selected?: string; restoreFocus: boolean } = {
    scroll: 0,
    restoreFocus: false,
  };

  updateGallery(patch: Partial<ExperienceMemory['gallery']>) {
    Object.assign(this.gallery, patch);
  }
  getOrbit(slug: string) {
    return this.sessions.get(slug);
  }
  saveOrbit(slug: string, session: OrbitSession) {
    this.sessions.set(slug, session);
  }
}

const MemoryContext = createContext<ExperienceMemory | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [memory] = useState(() => new ExperienceMemory());
  return (
    <ThemeProvider attribute="class" defaultTheme={DEFAULT_THEME} enableSystem>
      <MemoryContext.Provider value={memory}>{children}</MemoryContext.Provider>
    </ThemeProvider>
  );
}

export function useExperienceMemory() {
  const memory = useContext(MemoryContext);
  if (!memory) throw new Error('Experience provider is missing.');
  return memory;
}
