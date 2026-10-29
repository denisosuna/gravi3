import { ROUTES } from '@/shared/constants/routes';
import { sectionMetadata } from '@/server/metadata';
import { CalibrationFlow } from '@/features/calibration/components/calibration-flow';

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return sectionMetadata(params, ROUTES.calibration, 'calibrationTitle');
}

export default function CalibrationPage() {
  return (
    <main id="main" className="learning-page">
      <CalibrationFlow />
    </main>
  );
}
