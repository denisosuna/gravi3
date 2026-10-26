'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowUpRight, Globe2, Orbit, SunMoon } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';

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
      <Link href="/" className="brand" aria-label={t('home')}>
        <Orbit aria-hidden="true" />
        <span>Gravi3</span>
        <span className="brand-note">INTERACTIVE OBSERVATORY</span>
      </Link>
      <nav aria-label={t('navigation')} className="main-nav">
        <Link href="/learn" aria-current={pathname.startsWith('/learn') ? 'page' : undefined}>
          {t('learn')}
        </Link>
        <Link href="/orbits" aria-current={pathname.startsWith('/orbits') ? 'page' : undefined}>
          {t('orbits')}
        </Link>
      </nav>
      <div className="header-tools">
        <label className="icon-select">
          <Globe2 size={16} aria-hidden="true" />
          <span className="sr-only">{t('language')}</span>
          <select
            aria-label={t('language')}
            value={locale}
            onChange={(event) =>
              router.replace(pathname, { locale: event.target.value, scroll: false })
            }
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label className="icon-select theme-select">
          <SunMoon size={18} aria-hidden="true" />
          <span className="sr-only">{t('theme')}</span>
          <select
            aria-label={t('theme')}
            value={theme ?? 'system'}
            onChange={(event) => setTheme(event.target.value)}
            suppressHydrationWarning
          >
            <option value="system">{t('system')}</option>
            <option value="dark">{t('dark')}</option>
            <option value="light">{t('light')}</option>
          </select>
        </label>
        <a
          className="source-link"
          href="https://github.com/denisosuna/gravi3"
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
