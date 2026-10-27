import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Providers } from '@/shared/ui/providers';
import { SITE } from '@/shared/constants/site';
import { getConfig } from '@/server/config';
import { FONT_VARIABLES } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getConfig().appUrl),
  title: `${SITE.name} — ${SITE.tagline}`,
  description: 'Learn gravity through experiments and explore six periodic three-body orbits.',
};

// Providers live above the [locale] segment so client state survives a language switch.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={FONT_VARIABLES} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
