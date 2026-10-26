import { readFile } from 'node:fs/promises';
import { ASSETS } from '../src/constants/routes';
import { orbits } from '../src/data/orbits';
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
