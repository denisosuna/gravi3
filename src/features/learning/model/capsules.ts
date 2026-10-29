import { LEVELS, type Level } from '@/features/calibration/model/calibration';

// Learn is a deck of short capsules grouped in chapters; each capsule holds one idea.
export const CHAPTERS = ['attraction', 'mass-distance', 'three-bodies', 'periodic', 'lab'] as const;
export type Chapter = (typeof CHAPTERS)[number];

const EVERY_LEVEL = LEVELS;
const STUDENT_UP: readonly Level[] = ['student', 'advanced'];
const ADVANCED_ONLY: readonly Level[] = ['advanced'];

export const CAPSULES = [
  { id: 'pull', chapter: 'attraction', levels: EVERY_LEVEL },
  { id: 'mutual', chapter: 'attraction', levels: EVERY_LEVEL },
  { id: 'numbers', chapter: 'attraction', levels: STUDENT_UP },
  { id: 'mass', chapter: 'mass-distance', levels: EVERY_LEVEL },
  { id: 'predict', chapter: 'mass-distance', levels: EVERY_LEVEL },
  { id: 'check', chapter: 'mass-distance', levels: EVERY_LEVEL },
  { id: 'formula', chapter: 'mass-distance', levels: EVERY_LEVEL },
  { id: 'third', chapter: 'three-bodies', levels: EVERY_LEVEL },
  { id: 'chaos', chapter: 'three-bodies', levels: EVERY_LEVEL },
  { id: 'unstable', chapter: 'three-bodies', levels: STUDENT_UP },
  { id: 'energy', chapter: 'three-bodies', levels: ADVANCED_ONLY },
  { id: 'periodic', chapter: 'periodic', levels: EVERY_LEVEL },
  { id: 'lab', chapter: 'lab', levels: EVERY_LEVEL },
] as const satisfies readonly { id: string; chapter: Chapter; levels: readonly Level[] }[];

export type Capsule = (typeof CAPSULES)[number];
export type CapsuleId = Capsule['id'];

export function capsulesForLevel(level: Level): Capsule[] {
  return CAPSULES.filter((capsule) => (capsule.levels as readonly Level[]).includes(level));
}

function isCapsuleId(value: unknown): value is CapsuleId {
  return CAPSULES.some((capsule) => capsule.id === value);
}

function isChapter(value: string): value is Chapter {
  return (CHAPTERS as readonly string[]).includes(value);
}

// The capsule a URL hash points to. A capsule hidden at this level opens its chapter instead,
// a chapter opens its first capsule, and anything else opens the start of the deck.
export function resolveCapsule(hash: string, deck: readonly Capsule[]): Capsule {
  const first = deck[0];
  if (!first) throw new RangeError('A deck needs at least one capsule.');
  const visible = deck.find((capsule) => capsule.id === hash);
  if (visible) return visible;
  const chapter = isCapsuleId(hash)
    ? CAPSULES.find((capsule) => capsule.id === hash)?.chapter
    : isChapter(hash)
      ? hash
      : undefined;
  return deck.find((capsule) => capsule.chapter === chapter) ?? first;
}

export function chapterCapsules(deck: readonly Capsule[], chapter: Chapter): Capsule[] {
  return deck.filter((capsule) => capsule.chapter === chapter);
}

export function neighbours(deck: readonly Capsule[], current: Capsule) {
  const index = deck.indexOf(current);
  return { previous: deck[index - 1], next: deck[index + 1] };
}

// What the learner has already seen in this chapter, for the one-line recap under the capsule.
export function discoveriesBefore(deck: readonly Capsule[], current: Capsule): Capsule[] {
  const chapter = chapterCapsules(deck, current.chapter);
  return chapter.slice(0, chapter.indexOf(current));
}
