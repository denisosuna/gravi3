// The calibration places a learner at a level with fixed rules: reproducible, testable and free,
// and no model can be talked into a different result.

export const LEVELS = ['explorer', 'student', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const UNKNOWN_ANSWER = 'unknown';

// The scene each question shows before asking; `null` questions are plain text.
export const CALIBRATION_SCENES = ['attraction', 'fall', 'distance', 'twins'] as const;
export type CalibrationScene = (typeof CALIBRATION_SCENES)[number];

export const MISCONCEPTIONS = [
  'one-way-gravity',
  'heavier-falls-faster',
  'linear-distance',
  'constant-gravity',
  'chaos-is-random',
  'no-sensitivity',
] as const;
export type Misconception = (typeof MISCONCEPTIONS)[number];

interface Question {
  id: string;
  scene: CalibrationScene | null;
  // Answers whose label is a drawing rather than only text.
  drawings: boolean;
  options: readonly string[];
  // Concept questions have a right answer; the experience question does not.
  correct?: string;
  // The idea to review after each wrong answer, including "I don't know".
  misconceptions?: Readonly<Record<string, Misconception>>;
}

export const CALIBRATION_QUESTIONS = [
  {
    id: 'experience',
    scene: null,
    drawings: false,
    options: ['none', 'school', 'university'],
  },
  {
    id: 'attraction',
    scene: 'attraction',
    drawings: true,
    options: ['apple-only', 'unequal', 'equal', UNKNOWN_ANSWER],
    correct: 'equal',
    misconceptions: {
      'apple-only': 'one-way-gravity',
      unequal: 'one-way-gravity',
      [UNKNOWN_ANSWER]: 'one-way-gravity',
    },
  },
  {
    id: 'fall',
    scene: 'fall',
    drawings: false,
    options: ['heavy', 'light', 'together', UNKNOWN_ANSWER],
    correct: 'together',
    misconceptions: {
      heavy: 'heavier-falls-faster',
      light: 'heavier-falls-faster',
      [UNKNOWN_ANSWER]: 'heavier-falls-faster',
    },
  },
  {
    id: 'distance',
    scene: 'distance',
    drawings: true,
    options: ['linear', 'inverse-square', 'constant', UNKNOWN_ANSWER],
    correct: 'inverse-square',
    misconceptions: {
      linear: 'linear-distance',
      constant: 'constant-gravity',
      [UNKNOWN_ANSWER]: 'linear-distance',
    },
  },
  {
    id: 'twins',
    scene: 'twins',
    drawings: false,
    options: ['same', 'diverge', 'random', UNKNOWN_ANSWER],
    correct: 'diverge',
    misconceptions: {
      same: 'no-sensitivity',
      random: 'chaos-is-random',
      [UNKNOWN_ANSWER]: 'no-sensitivity',
    },
  },
] as const satisfies readonly Question[];

export type CalibrationQuestion = (typeof CALIBRATION_QUESTIONS)[number];
export type QuestionId = CalibrationQuestion['id'];
export type Answers = Partial<Record<QuestionId, string>>;

const STUDENT_MINIMUM = 2;
const ADVANCED_MINIMUM = 4;
const NO_EXPERIENCE = 'none';

export interface CalibrationResult {
  level: Level;
  known: QuestionId[];
  review: Misconception[];
}

export function scoreCalibration(answers: Answers): CalibrationResult {
  const known: QuestionId[] = [];
  const review: Misconception[] = [];
  for (const question of CALIBRATION_QUESTIONS) {
    if (!('correct' in question)) continue;
    const answer = answers[question.id];
    if (answer === question.correct) known.push(question.id);
    const misconception = answer
      ? (question.misconceptions as Record<string, Misconception>)[answer]
      : undefined;
    if (misconception && !review.includes(misconception)) review.push(misconception);
  }
  const experienced = answers.experience !== undefined && answers.experience !== NO_EXPERIENCE;
  const level: Level =
    known.length >= ADVANCED_MINIMUM && experienced
      ? 'advanced'
      : known.length >= STUDENT_MINIMUM
        ? 'student'
        : 'explorer';
  return { level, known, review };
}
