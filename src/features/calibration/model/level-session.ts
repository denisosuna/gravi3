import { createSessionKey } from '@/shared/ui/providers';
import type { Level } from './calibration';

// The level lasts for the browser session and can be changed at any time; a reload starts fresh.
export const LEVEL_SESSION = createSessionKey<{ level: Level | null }>('level', () => ({
  level: null,
}));
