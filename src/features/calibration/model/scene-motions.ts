import { integrate } from '@/physics/integrator';
import { samplePositions } from '@/physics/interpolation';
import { toCenterOfMassFrame } from '@/physics/simulation';
import { STATE_LENGTH, type Masses, type State, type Trajectory } from '@/physics/types';
import type { CalibrationScene } from './calibration';

// Where one body is drawn at a moment of a calibration scene, in scene units.
export interface BodyPose {
  body: number;
  x: number;
  y: number;
  radius: number;
}

export interface SceneMotion {
  // Seconds the animation plays once before it stops; reduced motion shows the last frame.
  duration: number;
  poseAt(time: number): readonly BodyPose[];
  // Straight guides drawn under the bodies: a floor, a divider.
  guides: readonly (readonly [readonly [number, number], readonly [number, number]])[];
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const FLOOR_Y = -1.5;
const fall: SceneMotion = {
  duration: 4.2,
  // The balls are lifted to the same height and stopped there: dropping them would give the answer.
  poseAt(time) {
    const lift = easeInOut(clamp01(time / 1.8));
    const top = 1.1;
    return [
      { body: 1, x: -1.1, radius: 0.42, y: FLOOR_Y + 0.42 + lift * (top - FLOOR_Y - 0.42) },
      { body: 0, x: 1.1, radius: 0.2, y: FLOOR_Y + 0.2 + lift * (top - FLOOR_Y - 0.2) },
    ];
  },
  guides: [
    [
      [-2.6, FLOOR_Y],
      [2.6, FLOOR_Y],
    ],
  ],
};

const attraction: SceneMotion = {
  duration: 4,
  poseAt(time) {
    return [
      { body: 0, x: 0, y: -3.1, radius: 2 },
      { body: 1, x: 0, y: 0.9 + 0.12 * Math.sin(time * 2.2), radius: 0.24 },
    ];
  },
  guides: [],
};

const distance: SceneMotion = {
  duration: 3.6,
  poseAt(time) {
    const half = 0.45 + 1.7 * easeInOut(clamp01(time / 3.2));
    return [
      { body: 0, x: -half, y: 0, radius: 0.3 },
      { body: 1, x: half, y: 0, radius: 0.3 },
    ];
  },
  guides: [],
};

// Burrau's Pythagorean problem, integrated for real. The twin starts with one body moved by 1 %,
// and the animation stops while both runs still look the same.
const TWIN_MASSES: Masses = [3, 4, 5];
const TWIN_START: State = [1, 3, -2, -1, 1, -1, 0, 0, 0, 0, 0, 0];
const TWIN_SHIFT = 0.01;
const TWIN_DURATION = 1.4;
const TWIN_SCALE = 0.3;
const TWIN_OFFSET_X = 1.6;
const TWIN_RADIUS_PER_CUBE_ROOT = 0.075;

function twinTrajectory(shift: number): Trajectory {
  const start = [...TWIN_START];
  start[0] = start[0]! * (1 + shift);
  const centered = toCenterOfMassFrame(TWIN_MASSES, start);
  const samples = integrate(centered, TWIN_MASSES, TWIN_DURATION, { tolerance: 1e-10 });
  return { version: 1, slug: 'pythagorean', period: TWIN_DURATION, samples };
}

function createTwins(): SceneMotion {
  let runs: readonly [Trajectory, Trajectory] | undefined;
  const positions = Array<number>(STATE_LENGTH / 2).fill(0);
  return {
    duration: 3,
    poseAt(time) {
      runs ??= [twinTrajectory(0), twinTrajectory(TWIN_SHIFT)];
      const physical = clamp01(time / this.duration) * TWIN_DURATION;
      return runs.flatMap((run, side) => {
        samplePositions(run, physical, positions);
        const offset = side === 0 ? -TWIN_OFFSET_X : TWIN_OFFSET_X;
        return TWIN_MASSES.map((mass, body) => ({
          body,
          x: offset + positions[2 * body]! * TWIN_SCALE,
          y: positions[2 * body + 1]! * TWIN_SCALE,
          radius: TWIN_RADIUS_PER_CUBE_ROOT * Math.cbrt(mass),
        }));
      });
    },
    guides: [
      [
        [0, -1.9],
        [0, 1.9],
      ],
    ],
  };
}

export function sceneMotion(scene: CalibrationScene): SceneMotion {
  switch (scene) {
    case 'attraction':
      return attraction;
    case 'fall':
      return fall;
    case 'distance':
      return distance;
    case 'twins':
      return createTwins();
  }
}
