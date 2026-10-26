import type { MetadataRoute } from 'next';
import { getConfig } from '@/server/config';

export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: new URL('/sitemap.xml', getConfig().appUrl).href,
  };
}
