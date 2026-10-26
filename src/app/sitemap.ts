import type { MetadataRoute } from 'next';
import { orbits } from '@/data/orbits';
import { getConfig } from '@/server/config';

export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getConfig().appUrl;
  return ['es', 'en'].flatMap((locale) =>
    ['', '/learn', '/orbits', ...orbits.map((orbit) => `/orbits/${orbit.slug}`)].map((path) => ({
      url: new URL(`/${locale}${path}`, base).href,
      alternates: {
        languages: { es: new URL(`/es${path}`, base).href, en: new URL(`/en${path}`, base).href },
      },
    })),
  );
}
