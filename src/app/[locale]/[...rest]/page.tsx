import { notFound } from 'next/navigation';

// Unmatched paths under a locale render the translated not-found page instead of the default one.
export default function UnmatchedPath() {
  notFound();
}
