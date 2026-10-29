import { BODY_INDICES, bodyPosition, type State } from '@/physics/types';

// The largest distance between the same body in two runs: how far the changed run has drifted.
export function divergence(a: State, b: State): number {
  return Math.max(
    ...BODY_INDICES.map((body) => {
      const [ax, ay] = bodyPosition(a, body);
      const [bx, by] = bodyPosition(b, body);
      return Math.hypot(ax - bx, ay - by);
    }),
  );
}
