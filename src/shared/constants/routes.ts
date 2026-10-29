import type { OrbitSlug } from '@/physics/types';

export const ROUTES = {
  home: '/',
  learn: '/learn',
  calibration: '/learn/calibration',
  orbits: '/orbits',
  orbit: (slug: OrbitSlug) => `/orbits/${slug}`,
  // The free laboratory of Learn, started from a gallery orbit.
  orbitInLab: (slug: OrbitSlug) => `/learn?orbit=${slug}#lab`,
} as const;

export const API_ROUTES = {
  tutor: '/api/tutor',
  health: '/api/health',
} as const;

export const ASSETS = {
  orbitPreview: (slug: OrbitSlug) => `/previews/${slug}.svg`,
  orbitTrajectory: (slug: OrbitSlug) => `/orbits/${slug}.json`,
  openGraphImage: '/opengraph-image',
} as const;

export function localizedPath(locale: string, path: string): string {
  return path === ROUTES.home ? `/${locale}` : `/${locale}${path}`;
}
