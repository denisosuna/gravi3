export interface Experiment {
  mass1: number;
  mass2: number;
  distance: number;
  prediction: 'half' | 'quarter' | 'double' | null;
}

export const initialExperiment: Experiment = {
  mass1: 100,
  mass2: 100,
  distance: 5,
  prediction: null,
};
export const massRange = { min: 100, max: 1000, step: 50 };
export const distanceRange = { min: 2, max: 20, step: 0.5 };
