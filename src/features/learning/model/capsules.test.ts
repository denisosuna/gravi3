import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
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

// The point of a capsule is one short idea; longer text belongs in "Learn more".
const MAX_BODY_WORDS = 40;

describe('capsule copy', () => {
  it.each([
    ['es', es],
    ['en', en],
  ])('gives every capsule a title, a short body and a discovery in %s', (_, messages) => {
    const copy: Record<string, { title?: string; body?: string; discovery?: string }> =
      messages.learn.capsules;
    for (const { id } of CAPSULES) {
      const capsule = copy[id];
      expect(capsule?.title, id).toBeTruthy();
      expect(capsule?.discovery, id).toBeTruthy();
      expect(capsule?.body?.split(/\s+/).length, id).toBeLessThanOrEqual(MAX_BODY_WORDS);
    }
  });
});
