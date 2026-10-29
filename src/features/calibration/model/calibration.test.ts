import { describe, expect, it } from 'vitest';
import { CALIBRATION_QUESTIONS, scoreCalibration, UNKNOWN_ANSWER } from './calibration';

const allCorrect = {
  attraction: 'equal',
  fall: 'together',
  distance: 'inverse-square',
  twins: 'diverge',
} as const;

describe('calibration scoring', () => {
  it('places by concepts known, and needs some study for the advanced level', () => {
    expect(scoreCalibration({}).level).toBe('explorer');
    expect(scoreCalibration({ attraction: 'equal', fall: 'together' }).level).toBe('student');
    expect(scoreCalibration({ ...allCorrect, experience: 'none' }).level).toBe('student');
    expect(scoreCalibration({ ...allCorrect, experience: 'school' }).level).toBe('advanced');
  });

  it('lists what the learner knows and the ideas to review, unknown answers included', () => {
    const result = scoreCalibration({
      attraction: 'apple-only',
      fall: 'heavy',
      distance: 'inverse-square',
      twins: UNKNOWN_ANSWER,
    });
    expect(result.known).toEqual(['distance']);
    expect(result.review).toEqual(['one-way-gravity', 'heavier-falls-faster', 'no-sensitivity']);
  });

  it('offers "I do not know" on every concept question', () => {
    for (const question of CALIBRATION_QUESTIONS)
      if ('correct' in question) expect(question.options).toContain(UNKNOWN_ANSWER);
  });
});
