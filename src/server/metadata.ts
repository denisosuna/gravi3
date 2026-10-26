import 'server-only';
import type { Metadata } from 'next';
import { ASSETS, localizedPath } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE, isLocale, LOCALES, OPEN_GRAPH_LOCALES, type Locale } from '@/i18n/config';
import { getConfig } from './config';

const OPEN_GRAPH_IMAGE = { width: 1200, height: 630 } as const;

export function localizedUrl(locale: string, path: string): string {
  return new URL(localizedPath(locale, path), getConfig().appUrl).href;
}

export function alternateLanguages(path: string): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
  ) as Record<Locale, string>;
}

export function pageMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
): Metadata {
  const fullTitle = `${title} | ${SITE.name}`;
  const canonical = localizedUrl(locale, path);
  return {
    title: fullTitle,
    description,
    metadataBase: new URL(getConfig().appUrl),
    alternates: { canonical, languages: alternateLanguages(path) },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE.name,
      locale: OPEN_GRAPH_LOCALES[isLocale(locale) ? locale : DEFAULT_LOCALE],
      type: 'website',
      images: [
        { url: ASSETS.openGraphImage, ...OPEN_GRAPH_IMAGE, alt: `${SITE.name} · ${SITE.tagline}` },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ASSETS.openGraphImage],
    },
  };
}

type SeoTitleKey = 'homeTitle' | 'learnTitle' | 'orbitsTitle';

export async function sectionMetadata(
  params: Promise<{ locale: string }>,
  path: string,
  titleKey: SeoTitleKey,
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return pageMetadata(locale, path, t(titleKey), t('description'));
}
