import { readFile, writeFile } from 'node:fs/promises';
import { ASSETS } from '../src/constants/routes';
import { orbits } from '../src/data/orbits';
import { parseTrajectory } from '../src/physics/trajectory-schema';
import { previewSvg, publicAssetPath } from './orbit-tools';

// Redraws the gallery previews from the committed, validated trajectories without integrating again.
for (const orbit of orbits) {
  const json: unknown = JSON.parse(
    await readFile(publicAssetPath(ASSETS.orbitTrajectory(orbit.slug)), 'utf8'),
  );
  await writeFile(
    publicAssetPath(ASSETS.orbitPreview(orbit.slug)),
    previewSvg(parseTrajectory(json, orbit)),
  );
  console.log(JSON.stringify({ event: 'orbit.preview_written', slug: orbit.slug }));
}
