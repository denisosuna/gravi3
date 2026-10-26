import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ASSETS } from '../src/constants/routes';
import { orbits } from '../src/data/orbits';
import { integrate } from '../src/physics/integrator';
import { TRAJECTORY_VERSION } from '../src/physics/trajectory-schema';
import type { Trajectory } from '../src/physics/types';
import { compressSamples, diagnose, previewSvg, publicAssetPath, thresholds } from './orbit-tools';

const sample = orbits[0]!.slug;

await Promise.all(
  [
    dirname(publicAssetPath(ASSETS.orbitTrajectory(sample))),
    dirname(publicAssetPath(ASSETS.orbitPreview(sample))),
    'docs',
  ].map((path) => mkdir(path, { recursive: true })),
);
const reports = [];
for (const orbit of orbits) {
  const dense = integrate(orbit.initialState, orbit.masses, orbit.period, {
    tolerance: 1e-12,
    gravitationalConstant: orbit.gravitationalConstant,
  });
  const trajectory: Trajectory = {
    version: TRAJECTORY_VERSION,
    slug: orbit.slug,
    period: orbit.period,
    samples: compressSamples(dense, orbit.period),
  };
  const metrics = diagnose(orbit, trajectory);
  reports.push({ slug: orbit.slug, source: orbit.source, variant: orbit.variant, ...metrics });
  await writeFile(publicAssetPath(ASSETS.orbitTrajectory(orbit.slug)), JSON.stringify(trajectory));
  await writeFile(publicAssetPath(ASSETS.orbitPreview(orbit.slug)), previewSvg(trajectory));
  console.log(JSON.stringify({ event: 'orbit.generated', slug: orbit.slug, ...metrics }));
}
await writeFile(
  'docs/orbit-validation.json',
  JSON.stringify(
    { method: 'Dormand–Prince 5(4), tolerance 1e-12; reference 1e-13', thresholds, reports },
    null,
    2,
  ) + '\n',
);
