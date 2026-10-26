import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gravi3 · Gravity & the three-body problem',
  description: 'Learn gravity through experiments and explore six periodic three-body orbits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
