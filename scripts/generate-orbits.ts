import { mkdir, writeFile } from 'node:fs/promises';
import { orbits } from '../src/data/orbits';
import { integrate } from '../src/physics/integrator';
import type { Trajectory } from '../src/physics/types';
import { compressSamples, diagnose, previewSvg, thresholds } from './orbit-tools';

await Promise.all(
  ['public/orbits', 'public/previews', 'docs'].map((path) => mkdir(path, { recursive: true })),
);
const reports = [];
for (const orbit of orbits) {
  const dense = integrate(orbit.initialState, orbit.masses, orbit.period, {
    tolerance: 1e-12,
    gravitationalConstant: orbit.gravitationalConstant,
  });
  const trajectory: Trajectory = {
    version: 1,
    slug: orbit.slug,
    period: orbit.period,
    samples: compressSamples(dense, orbit.period),
  };
  const metrics = diagnose(orbit, trajectory);
  reports.push({ slug: orbit.slug, source: orbit.source, variant: orbit.variant, ...metrics });
  await writeFile(`public/orbits/${orbit.slug}.json`, JSON.stringify(trajectory));
  await writeFile(`public/previews/${orbit.slug}.svg`, previewSvg(trajectory));
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
