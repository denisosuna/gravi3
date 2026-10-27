import { createSessionKey } from '@/components/providers';
import { ROUTES } from '@/constants/routes';
import type { OrbitSlug } from '@/physics/types';

interface GallerySession {
  scroll: number;
  selected?: OrbitSlug;
  restoreFocus: boolean;
  // Gallery path with its filters, so "back to gallery" returns to the same view.
  href: string;
}

export const GALLERY_SESSION = createSessionKey<GallerySession>('gallery', () => ({
  scroll: 0,
  restoreFocus: false,
  href: ROUTES.orbits,
}));
