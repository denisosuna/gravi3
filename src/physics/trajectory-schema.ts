import { z } from 'zod';
import { STATE_LENGTH, type OrbitDefinition, type Trajectory } from './types';

export const TRAJECTORY_VERSION = 1;

const sampleSchema = z.object({
  time: z.number().nonnegative(),
  state: z.array(z.number().finite()).length(STATE_LENGTH),
});

const trajectorySchema = z.object({
  version: z.literal(TRAJECTORY_VERSION),
  slug: z.string(),
  period: z.number().positive(),
  samples: z.array(sampleSchema).min(2),
});

// Validates a generated trajectory against its catalog entry; used by the browser and the CI check.
export function parseTrajectory(
  json: unknown,
  orbit: Pick<OrbitDefinition, 'slug' | 'period'>,
): Trajectory {
  const trajectory = trajectorySchema.parse(json);
  if (trajectory.slug !== orbit.slug || trajectory.period !== orbit.period)
    throw new Error(`Trajectory does not match catalog entry: ${orbit.slug}`);
  const { samples } = trajectory;
  if (samples[0]!.time !== 0 || samples.at(-1)!.time !== orbit.period)
    throw new Error(`Trajectory must cover exactly one period: ${orbit.slug}`);
  if (samples.some((sample, index) => index > 0 && sample.time <= samples[index - 1]!.time))
    throw new Error(`Trajectory sample times must increase: ${orbit.slug}`);
  return trajectory;
}
