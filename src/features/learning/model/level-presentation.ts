import type { Level } from '@/features/calibration/model/calibration';

export const READOUTS = ['time', 'energy', 'drift', 'center', 'separation'] as const;
export type Readout = (typeof READOUTS)[number];

interface LevelPresentation {
  // Significant digits of forces in newtons; `null` shows the force relative to the start instead.
  forceDigits: number | null;
  // Simulator readouts on screen; the rest stay available in the free laboratory.
  readouts: readonly Readout[];
  // Whether the formula is shown or waits behind "See the formula".
  formulaOpen: boolean;
  // Whether G and the per-body accelerations are shown.
  constants: boolean;
}

// How each level presents the same physics: what is measured never changes, only how much is shown.
export const LEVEL_PRESENTATION: Readonly<Record<Level, LevelPresentation>> = {
  explorer: { forceDigits: null, readouts: [], formulaOpen: false, constants: false },
  student: {
    forceDigits: 3,
    readouts: ['time', 'separation'],
    formulaOpen: true,
    constants: false,
  },
  advanced: { forceDigits: 6, readouts: READOUTS, formulaOpen: true, constants: true },
};
