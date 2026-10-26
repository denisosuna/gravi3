'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowUpRight, Globe2, Orbit, SunMoon } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { isLocale, LOCALES } from '@/i18n/config';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { DEFAULT_THEME, THEMES } from './providers';

const NAV_ITEMS = [
  { href: ROUTES.learn, label: 'learn' },
  { href: ROUTES.orbits, label: 'orbits' },
] as const;

export function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <header className="site-header">
      <Link href={ROUTES.home} className="brand" aria-label={t('home')}>
        <Orbit aria-hidden="true" />
        <span>{SITE.name}</span>
        <span className="brand-note">{t('brandNote')}</span>
      </Link>
      <nav aria-label={t('navigation')} className="main-nav">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? 'page' : undefined}
          >
            {t(label)}
          </Link>
        ))}
      </nav>
      <div className="header-tools">
        <label className="icon-select">
          <Globe2 size={16} aria-hidden="true" />
          <span className="sr-only">{t('language')}</span>
          <select
            aria-label={t('language')}
            value={locale}
            onChange={({ target }) => {
              if (isLocale(target.value))
                router.replace(pathname, { locale: target.value, scroll: false });
            }}
          >
            {LOCALES.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="icon-select theme-select">
          <SunMoon size={18} aria-hidden="true" />
          <span className="sr-only">{t('theme')}</span>
          <select
            aria-label={t('theme')}
            value={theme ?? DEFAULT_THEME}
            onChange={(event) => setTheme(event.target.value)}
            suppressHydrationWarning
          >
            {THEMES.map((option) => (
              <option key={option} value={option}>
                {t(option)}
              </option>
            ))}
          </select>
        </label>
        <a
          className="source-link"
          href={SITE.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={t('source')}
        >
          GitHub <ArrowUpRight size={14} />
        </a>
      </div>
    </header>
  );
}
