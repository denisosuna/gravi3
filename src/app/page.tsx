import { redirect } from 'next/navigation';
import { localizedPath, ROUTES } from '@/constants/routes';
import { DEFAULT_LOCALE } from '@/i18n/config';

export default function Home() {
  redirect(localizedPath(DEFAULT_LOCALE, ROUTES.home));
}
