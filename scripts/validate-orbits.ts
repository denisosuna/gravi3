import { readFile } from 'node:fs/promises';
import { ASSETS } from '../src/constants/routes';
import { orbits } from '../src/data/orbits';
import type { Trajectory } from '../src/physics/types';
import { diagnose, publicAssetPath } from './orbit-tools';

for (const orbit of orbits) {
  const trajectory: Trajectory = JSON.parse(
    await readFile(publicAssetPath(ASSETS.orbitTrajectory(orbit.slug)), 'utf8'),
  );
  if (
    trajectory.slug !== orbit.slug ||
    trajectory.version !== 1 ||
    trajectory.period !== orbit.period ||
    trajectory.samples.length < 2
  )
    throw new Error(`Invalid manifest: ${orbit.slug}`);
  for (const [index, sample] of trajectory.samples.entries()) {
    if (
      sample.state.length !== 12 ||
      !sample.state.every(Number.isFinite) ||
      !Number.isFinite(sample.time) ||
      (index > 0 && sample.time <= trajectory.samples[index - 1]!.time)
    )
      throw new Error(`Invalid sample: ${orbit.slug}/${index}`);
  }
  if (trajectory.samples[0]!.time !== 0 || trajectory.samples.at(-1)!.time !== orbit.period)
    throw new Error(`Invalid time domain: ${orbit.slug}`);
  console.log(
    JSON.stringify({ event: 'orbit.validated', slug: orbit.slug, ...diagnose(orbit, trajectory) }),
  );
}
