import type { Sample, Trajectory } from './types';

export function interpolatePosition(
  a: Sample,
  b: Sample,
  time: number,
  coordinate: number,
): number {
  const span = b.time - a.time;
  const t = span === 0 ? 0 : Math.max(0, Math.min(1, (time - a.time) / span));
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * a.state[coordinate]! +
    (t3 - 2 * t2 + t) * span * a.state[coordinate + 6]! +
    (-2 * t3 + 3 * t2) * b.state[coordinate]! +
    (t3 - t2) * span * b.state[coordinate + 6]!
  );
}

export function samplePositions(trajectory: Trajectory, time: number, target: number[]): number[] {
  const samples = trajectory.samples;
  const clamped = Math.max(0, Math.min(trajectory.period, time));
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >>> 1;
    if (samples[middle]!.time <= clamped) low = middle;
    else high = middle;
  }
  for (let coordinate = 0; coordinate < 6; coordinate++) {
    target[coordinate] = interpolatePosition(samples[low]!, samples[high]!, clamped, coordinate);
  }
  return target;
}
