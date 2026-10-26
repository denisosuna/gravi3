import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Providers } from '@/components/providers';
import { getConfig } from '@/server/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getConfig().appUrl),
  title: 'Gravi3 · Gravity & the three-body problem',
  description: 'Learn gravity through experiments and explore six periodic three-body orbits.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await headers()).get('x-next-intl-locale') === 'en' ? 'en' : 'es';
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
