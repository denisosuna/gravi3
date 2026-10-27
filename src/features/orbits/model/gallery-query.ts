import { z } from 'zod';
import { ROUTES } from '@/shared/constants/routes';
import { ORBIT_CATALOG, ORBIT_FAMILIES, orbits, type OrbitFamily } from '@/physics/orbit-catalog';
import { orbitSlugs, type OrbitDefinition, type OrbitSlug } from '@/physics/types';

export const GALLERY_SORTS = ['catalog', 'period', 'year'] as const;
type GallerySort = (typeof GALLERY_SORTS)[number];
export const MAX_COMPARED = 3;
const DEFAULT_SORT: GallerySort = 'catalog';
const LIST_SEPARATOR = ',';

export interface GalleryQuery {
  family?: OrbitFamily;
  sort: GallerySort;
  compare: readonly OrbitSlug[];
}

export const DEFAULT_GALLERY_QUERY: GalleryQuery = { sort: DEFAULT_SORT, compare: [] };

type SearchParams = Record<string, string | string[] | undefined>;

const isOrbitSlug = (value: string): value is OrbitSlug =>
  (orbitSlugs as readonly string[]).includes(value);

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The URL is user input: unknown values fall back to defaults instead of failing the page.
const querySchema = z.object({
  family: z.enum(ORBIT_FAMILIES).optional().catch(undefined),
  sort: z.enum(GALLERY_SORTS).catch(DEFAULT_SORT).default(DEFAULT_SORT),
  compare: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) =>
      [...new Set(value?.split(LIST_SEPARATOR))].filter(isOrbitSlug).slice(0, MAX_COMPARED),
    ),
});

export function parseGalleryQuery(params: SearchParams): GalleryQuery {
  const { family, sort, compare } = querySchema.parse({
    family: first(params.family),
    sort: first(params.sort),
    compare: first(params.compare),
  });
  return family ? { family, sort, compare } : { sort, compare };
}

const SORT_KEYS: Record<GallerySort, (orbit: OrbitDefinition) => number> = {
  catalog: (orbit) => orbits.indexOf(orbit),
  period: (orbit) => orbit.period,
  year: (orbit) => ORBIT_CATALOG[orbit.slug].discovery.year,
};

export function selectOrbits(query: GalleryQuery): OrbitDefinition[] {
  const key = SORT_KEYS[query.sort];
  return orbits
    .filter((orbit) => !query.family || ORBIT_CATALOG[orbit.slug].family === query.family)
    .sort((a, b) => key(a) - key(b) || orbits.indexOf(a) - orbits.indexOf(b));
}

export function toggleCompared(query: GalleryQuery, slug: OrbitSlug): GalleryQuery {
  const compare = query.compare.includes(slug)
    ? query.compare.filter((item) => item !== slug)
    : [...query.compare, slug].slice(-MAX_COMPARED);
  return { ...query, compare };
}

// Builds the gallery path for a query, leaving defaults out so plain URLs stay plain.
export function galleryHref(query: GalleryQuery): string {
  const params = new URLSearchParams();
  if (query.family) params.set('family', query.family);
  if (query.sort !== DEFAULT_SORT) params.set('sort', query.sort);
  if (query.compare.length > 0) params.set('compare', query.compare.join(LIST_SEPARATOR));
  const search = params.toString();
  return search ? `${ROUTES.orbits}?${search}` : ROUTES.orbits;
}
