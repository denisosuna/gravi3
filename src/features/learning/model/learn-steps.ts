// The lesson's order; each id is also the anchor of its section, used by the step rail and the tutor.
export const LEARN_STEPS = ['observe', 'predict', 'check', 'explain', 'three-bodies'] as const;
export type LearnStep = (typeof LEARN_STEPS)[number];
export const TUTOR_ANCHOR = 'tutor';
