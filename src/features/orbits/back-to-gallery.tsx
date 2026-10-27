'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { useSessionMemory } from '@/components/providers';
import { Link } from '@/i18n/routing';
import { GALLERY_SESSION } from './gallery-session';

// Returns to the gallery with the filters, order and comparison the visitor left it with.
export function BackToGallery({ className }: { className?: string }) {
  const common = useTranslations('common');
  const { href } = useSessionMemory().get(GALLERY_SESSION);
  return (
    <Link className={className} href={href} scroll={false}>
      <ArrowLeft size={16} aria-hidden="true" />
      {common('back')}
    </Link>
  );
}
