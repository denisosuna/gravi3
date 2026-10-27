import { SITE } from '@/shared/constants/site';
import type { OrbitDefinition, OrbitSlug } from '@/physics/types';

const LI_LIAO_CATALOG_URL = 'https://numericaltank.sjtu.edu.cn/three-body/three-body-movies.htm';
const LAGRANGE_DERIVATION_URL = `${SITE.repositoryUrl}/blob/main/docs/physics.md#lagranges-analytic-solution`;
// All catalog orbits use equal unit masses and G = 1 (normalized units).
const NORMALIZED_UNITS = { masses: [1, 1, 1], gravitationalConstant: 1 } as const;

interface CollinearConditions {
  slug: OrbitDefinition['slug'];
  velocity: readonly [vx: number, vy: number];
  period: number;
  variant: string;
}

// Bodies start at (-1,0), (1,0), (0,0); the outer pair shares one velocity, the center balances momentum.
function collinear({
  slug,
  velocity: [vx, vy],
  period,
  variant,
}: CollinearConditions): OrbitDefinition {
  return {
    slug,
    ...NORMALIZED_UNITS,
    period,
    initialState: [-1, 0, 1, 0, 0, 0, vx, vy, vx, vy, -2 * vx, -2 * vy],
    source: LI_LIAO_CATALOG_URL,
    variant,
  };
}

const omega = 3 ** -0.25;
const height = Math.sqrt(3) / 2;

export const orbits: readonly OrbitDefinition[] = [
  {
    slug: 'lagrange',
    ...NORMALIZED_UNITS,
    period: (2 * Math.PI) / omega,
    initialState: [
      1,
      0,
      -0.5,
      height,
      -0.5,
      -height,
      0,
      omega,
      -height * omega,
      -omega / 2,
      height * omega,
      -omega / 2,
    ],
    source: LAGRANGE_DERIVATION_URL,
    variant:
      'Lagrange (1772) analytic circular equilateral solution; unit circumradius, omega=3^(-1/4).',
  },
  collinear({
    slug: 'figure-eight',
    velocity: [0.3471168881, 0.5327249454],
    period: 6.3259139829,
    variant: 'Li/Liao I.A initial condition 1; Moore/Chenciner–Montgomery figure eight.',
  }),
  collinear({
    slug: 'butterfly-i',
    velocity: [0.3068934205, 0.125506567],
    period: 6.2346748391,
    variant: 'Li/Liao I.A initial condition 2; original I.A.1 Butterfly I.',
  }),
  collinear({
    slug: 'goggles',
    velocity: [0.0833000718, 0.1278892555],
    period: 10.4648495256,
    variant: 'Li/Liao I.B initial condition 3; original I.B.5 Goggles.',
  }),
  collinear({
    slug: 'moth-i',
    velocity: [0.4644451728, 0.3960600146],
    period: 14.8943051743,
    variant: 'Li/Liao I.B initial condition 1; original I.B.1 Moth I.',
  }),
  collinear({
    slug: 'yin-yang-i',
    velocity: [0.2827020949, 0.3272089716],
    period: 10.9633031497,
    variant: 'Li/Liao II.C initial condition 1; original II.C.2b Yin-Yang I.',
  }),
];

// Classes from Šuvakov and Dmitrašinović (2013), which group orbits by their symmetries;
// Li and Liao (2017) place the figure eight in class I.A. Lagrange's solution predates them.
export const ORBIT_FAMILIES = ['analytic', 'I.A', 'I.B', 'II.C'] as const;
export type OrbitFamily = (typeof ORBIT_FAMILIES)[number];

export interface OrbitCatalogEntry {
  family: OrbitFamily;
  // Šuvakov–Dmitrašinović catalogue code, when the orbit has one.
  code?: string;
  discovery: { year: number; authors: string };
  // First moment, as a fraction of the period, when two bodies come closest, and that distance.
  // Measured on the validated trajectory; Lagrange's separations never change.
  closestApproach?: { fraction: number; distance: number };
}

const SUVAKOV_DMITRASINOVIC = { year: 2013, authors: 'Šuvakov & Dmitrašinović' } as const;

export const ORBIT_CATALOG: Readonly<Record<OrbitSlug, OrbitCatalogEntry>> = {
  lagrange: { family: 'analytic', discovery: { year: 1772, authors: 'Lagrange' } },
  'figure-eight': {
    family: 'I.A',
    discovery: { year: 1993, authors: 'Moore' },
    closestApproach: { fraction: 0.0833, distance: 0.6905 },
  },
  'butterfly-i': {
    family: 'I.A',
    code: 'I.A.1',
    discovery: SUVAKOV_DMITRASINOVIC,
    closestApproach: { fraction: 0.2024, distance: 0.011 },
  },
  goggles: {
    family: 'I.B',
    code: 'I.B.5',
    discovery: SUVAKOV_DMITRASINOVIC,
    closestApproach: { fraction: 0.1016, distance: 0.0185 },
  },
  'moth-i': {
    family: 'I.B',
    code: 'I.B.1',
    discovery: SUVAKOV_DMITRASINOVIC,
    closestApproach: { fraction: 0.1523, distance: 0.0795 },
  },
  'yin-yang-i': {
    family: 'II.C',
    code: 'II.C.2b',
    discovery: SUVAKOV_DMITRASINOVIC,
    closestApproach: { fraction: 0.384, distance: 0.0098 },
  },
};

export function findOrbit(slug: string) {
  return orbits.find((orbit) => orbit.slug === slug);
}

// For slugs already checked by the type system or the router.
export function orbitFor(slug: OrbitSlug): OrbitDefinition {
  const orbit = findOrbit(slug);
  if (!orbit) throw new RangeError(`Unknown orbit: ${slug}`);
  return orbit;
}
