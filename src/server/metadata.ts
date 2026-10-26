import 'server-only';
import type { Metadata } from 'next';
import { getConfig } from './config';

export function pageMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
): Metadata {
  const base = new URL(getConfig().appUrl);
  const canonical = new URL(`/${locale}${path}`, base).href;
  return {
    title: `${title} | Gravi3`,
    description,
    metadataBase: base,
    alternates: {
      canonical,
      languages: { es: new URL(`/es${path}`, base).href, en: new URL(`/en${path}`, base).href },
    },
    openGraph: {
      title: `${title} | Gravi3`,
      description,
      url: canonical,
      siteName: 'Gravi3',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Gravi3 · Gravity & the three-body problem',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Gravi3`,
      description,
      images: ['/opengraph-image'],
    },
  };
}
