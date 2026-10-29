import type { MetadataRoute } from 'next';
import { ROUTES } from '@/shared/constants/routes';
import { orbits } from '@/physics/orbit-catalog';
import { LOCALES } from '@/i18n/config';
import { alternateLanguages, localizedUrl } from '@/server/metadata';

export const dynamic = 'force-dynamic';

const PATHS = [
  ROUTES.home,
  ROUTES.learn,
  ROUTES.calibration,
  ROUTES.orbits,
  ...orbits.map((orbit) => ROUTES.orbit(orbit.slug)),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PATHS.map((path) => ({
      url: localizedUrl(locale, path),
      alternates: { languages: alternateLanguages(path) },
    })),
  );
}
