import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});
export type Locale = (typeof routing.locales)[number];
export const { Link, usePathname, useRouter } = createNavigation(routing);
