import { notFound } from 'next/navigation';
import { findOrbit } from '@/data/orbits';
import { OrbitDetail } from '@/features/orbits/orbit-detail';

export default async function OrbitPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const orbit = findOrbit(slug);
  if (!orbit) notFound();
  return <OrbitDetail orbit={orbit} />;
}
