export const PREDICTIONS = ['half', 'quarter', 'double'] as const;
export type PredictionAnswer = (typeof PREDICTIONS)[number];
// Doubling the distance divides the force by four.
export const CORRECT_PREDICTION: PredictionAnswer = 'quarter';

export const UNITS = { mass: 'kg', distance: 'm', force: 'N', acceleration: 'm/s²' } as const;

export interface Experiment {
  mass1: number;
  mass2: number;
  distance: number;
  prediction: PredictionAnswer | null;
  // Whether the learner has doubled a quantity to test the prediction.
  checked: boolean;
}

export const initialExperiment: Experiment = {
  mass1: 100,
  mass2: 100,
  distance: 5,
  prediction: null,
  checked: false,
};
export const massRange = { min: 100, max: 1000, step: 50 };
export const distanceRange = { min: 2, max: 20, step: 0.5 };
