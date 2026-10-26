import type { OrbitDefinition } from '../physics/types';

const catalogSource = 'https://numericaltank.sjtu.edu.cn/three-body/three-body-movies.htm';

function collinear(
  slug: string,
  vx: number,
  vy: number,
  period: number,
  variant: string,
): OrbitDefinition {
  return {
    slug,
    masses: [1, 1, 1],
    gravitationalConstant: 1,
    period,
    initialState: [-1, 0, 1, 0, 0, 0, vx, vy, vx, vy, -2 * vx, -2 * vy],
    source: catalogSource,
    variant,
  };
}

const omega = 3 ** -0.25;
const height = Math.sqrt(3) / 2;

export const orbits: readonly OrbitDefinition[] = [
  {
    slug: 'lagrange',
    masses: [1, 1, 1],
    gravitationalConstant: 1,
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
    source: 'https://arxiv.org/html/1303.0181v1',
    variant: 'Analytic circular equilateral solution; unit circumradius, omega=3^(-1/4).',
  },
  collinear(
    'figure-eight',
    0.3471168881,
    0.5327249454,
    6.3259139829,
    'Li/Liao I.A initial condition 1; Moore/Chenciner–Montgomery figure eight.',
  ),
  collinear(
    'butterfly-i',
    0.3068934205,
    0.125506567,
    6.2346748391,
    'Li/Liao I.A initial condition 2; original I.A.1 Butterfly I.',
  ),
  collinear(
    'goggles',
    0.0833000718,
    0.1278892555,
    10.4648495256,
    'Li/Liao I.B initial condition 3; original I.B.5 Goggles.',
  ),
  collinear(
    'moth-i',
    0.4644451728,
    0.3960600146,
    14.8943051743,
    'Li/Liao I.B initial condition 1; original I.B.1 Moth I.',
  ),
  collinear(
    'yin-yang-i',
    0.2827020949,
    0.3272089716,
    10.9633031497,
    'Li/Liao II.C initial condition 1; original II.C.2b Yin-Yang I.',
  ),
];

export function findOrbit(slug: string) {
  return orbits.find((orbit) => orbit.slug === slug);
}
