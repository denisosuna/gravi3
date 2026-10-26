export type Masses = readonly [number, number, number];

// State layout: x1,y1,x2,y2,x3,y3,vx1,vy1,vx2,vy2,vx3,vy3.
export type State = readonly number[];

export interface Sample {
  time: number;
  state: State;
}

export interface OrbitDefinition {
  slug: string;
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
