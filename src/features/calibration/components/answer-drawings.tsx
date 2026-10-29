import type { ReactNode } from 'react';

const INK = 'currentColor';
const APPLE = 'var(--body-2)';
const EARTH = 'var(--body-1)';

function Arrow({ x, from, to }: { x: number; from: number; to: number }) {
  const down = to > from;
  const tip = down
    ? `${x - 6},${to - 9} ${x},${to} ${x + 6},${to - 9}`
    : `${x - 6},${to + 9} ${x},${to} ${x + 6},${to + 9}`;
  return (
    <>
      <line x1={x} y1={from} x2={x} y2={down ? to - 6 : to + 6} stroke={INK} strokeWidth={3} />
      <polygon points={tip} fill={INK} />
    </>
  );
}

function ForceSketch({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="72" aria-hidden="true">
      <circle cx="50" cy="12" r="8" fill={APPLE} />
      <rect x="10" y="68" width="80" height="10" rx="5" fill={EARTH} />
      {children}
    </svg>
  );
}

function Graph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="72" aria-hidden="true">
      <line x1="14" y1="6" x2="14" y2="68" stroke={INK} strokeOpacity={0.4} strokeWidth={1.5} />
      <line x1="14" y1="68" x2="114" y2="68" stroke={INK} strokeOpacity={0.4} strokeWidth={1.5} />
      {children}
    </svg>
  );
}

// Answers that are easier to recognise as a picture than to read; the text label stays as well.
export const ANSWER_DRAWINGS: Readonly<Record<string, ReactNode>> = {
  'apple-only': (
    <ForceSketch>
      <Arrow x={50} from={24} to={56} />
    </ForceSketch>
  ),
  unequal: (
    <ForceSketch>
      <Arrow x={42} from={24} to={52} />
      <Arrow x={66} from={66} to={58} />
    </ForceSketch>
  ),
  equal: (
    <ForceSketch>
      <Arrow x={42} from={24} to={50} />
      <Arrow x={66} from={66} to={40} />
    </ForceSketch>
  ),
  linear: (
    <Graph>
      <line x1="16" y1="10" x2="110" y2="64" stroke={INK} strokeWidth={3} />
    </Graph>
  ),
  'inverse-square': (
    <Graph>
      <polyline
        points="16,8 24,26 32,38 40,46 50,52 64,57 80,60 96,62 110,63"
        fill="none"
        stroke={INK}
        strokeWidth={3}
      />
    </Graph>
  ),
  constant: (
    <Graph>
      <line x1="16" y1="30" x2="110" y2="30" stroke={INK} strokeWidth={3} />
    </Graph>
  ),
};
