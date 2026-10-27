import { readFile } from 'node:fs/promises';
import { ASSETS } from '../src/shared/constants/routes';
import { orbits } from '../src/physics/orbit-catalog';
import { parseTrajectory } from '../src/physics/trajectory-schema';
import { diagnose, publicAssetPath } from './orbit-tools';

for (const orbit of orbits) {
  const json: unknown = JSON.parse(
    await readFile(publicAssetPath(ASSETS.orbitTrajectory(orbit.slug)), 'utf8'),
  );
  const trajectory = parseTrajectory(json, orbit);
  console.log(
    JSON.stringify({ event: 'orbit.validated', slug: orbit.slug, ...diagnose(orbit, trajectory) }),
  );
}
