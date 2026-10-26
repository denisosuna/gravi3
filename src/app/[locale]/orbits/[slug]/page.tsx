import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/server/metadata';
import { notFound } from 'next/navigation';
import { findOrbit } from '@/data/orbits';
import { OrbitDetail } from '@/features/orbits/orbit-detail';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();
  const t = await getTranslations({ locale, namespace: 'orbits' });
  return pageMetadata(locale, `/orbits/${slug}`, t(`${slug}.name`), t(`${slug}.description`));
}

export default async function OrbitPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();
  return <OrbitDetail key={orbit.slug} orbit={orbit} />;
}
