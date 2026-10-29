import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ASSETS, ROUTES } from '@/shared/constants/routes';
import { orbits } from '@/physics/orbit-catalog';
import styles from './capsules.module.css';

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 200;

// The six periodic solutions of the gallery, each one a link to its detail page.
export function PeriodicCapsule() {
  const t = useTranslations('orbits');
  return (
    <ul className={styles.orbits}>
      {orbits.map((orbit) => (
        <li key={orbit.slug}>
          <Link href={ROUTES.orbit(orbit.slug)}>
            <Image
              src={ASSETS.orbitPreview(orbit.slug)}
              alt=""
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
            />
            {t(`${orbit.slug}.name`)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
