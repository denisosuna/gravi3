export const orbitSlugs = [
  'lagrange',
  'figure-eight',
  'butterfly-i',
  'goggles',
  'moth-i',
  'yin-yang-i',
] as const;
export type OrbitSlug = (typeof orbitSlugs)[number];

export type Masses = readonly [number, number, number];

// State layout: x1,y1,x2,y2,x3,y3,vx1,vy1,vx2,vy2,vx3,vy3.
export type State = readonly number[];
export type Vec2 = readonly [number, number];

export const BODY_INDICES = [0, 1, 2] as const;
const VELOCITY_OFFSET = 2 * BODY_INDICES.length;
export const STATE_LENGTH = 2 * VELOCITY_OFFSET;

export function bodyPosition(state: State, body: number): Vec2 {
  return [state[2 * body]!, state[2 * body + 1]!];
}

export function bodyVelocity(state: State, body: number): Vec2 {
  return [state[VELOCITY_OFFSET + 2 * body]!, state[VELOCITY_OFFSET + 2 * body + 1]!];
}

export interface Sample {
  time: number;
  state: State;
}

export interface OrbitDefinition {
  slug: OrbitSlug;
  masses: Masses;
  gravitationalConstant: number;
  period: number;
  initialState: State;
  source: string;
  variant: string;
}

export interface Trajectory {
  version: 1;
  slug: string;
  period: number;
  samples: Sample[];
}
