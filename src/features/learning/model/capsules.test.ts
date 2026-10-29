import { describe, expect, it } from 'vitest';
import {
  CAPSULES,
  CHAPTERS,
  capsulesForLevel,
  chapterCapsules,
  discoveriesBefore,
  neighbours,
  resolveCapsule,
} from './capsules';

const explorer = capsulesForLevel('explorer');
const advanced = capsulesForLevel('advanced');

describe('learning deck', () => {
  it('adds capsules with the level and never removes the free laboratory', () => {
    expect(explorer).toHaveLength(10);
    expect(capsulesForLevel('student')).toHaveLength(12);
    expect(advanced).toHaveLength(CAPSULES.length);
    for (const level of ['explorer', 'student', 'advanced'] as const) {
      const ids = capsulesForLevel(level).map((capsule) => capsule.id);
      expect(ids).toContain('lab');
      for (const chapter of CHAPTERS)
        expect(chapterCapsules(capsulesForLevel(level), chapter).length).toBeGreaterThan(0);
    }
  });

  it('resolves a hash to a capsule, its chapter or the start of the deck', () => {
    expect(resolveCapsule('check', explorer).id).toBe('check');
    expect(resolveCapsule('energy', explorer).id).toBe('third');
    expect(resolveCapsule('three-bodies', explorer).id).toBe('third');
    expect(resolveCapsule('', explorer).id).toBe('pull');
    expect(resolveCapsule('tutor', advanced).id).toBe('pull');
  });

  it('moves across chapters and recaps only earlier capsules of the current one', () => {
    const formula = resolveCapsule('formula', explorer);
    expect(neighbours(explorer, formula).next?.id).toBe('third');
    expect(neighbours(explorer, resolveCapsule('pull', explorer)).previous).toBeUndefined();
    expect(neighbours(explorer, resolveCapsule('lab', explorer)).next).toBeUndefined();
    expect(discoveriesBefore(explorer, formula).map((capsule) => capsule.id)).toEqual([
      'mass',
      'predict',
      'check',
    ]);
  });
});
