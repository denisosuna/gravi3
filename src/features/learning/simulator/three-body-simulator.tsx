import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { SceneBoundary } from '@/components/scene/scene-boundary';
import { useDocumentVisible } from '@/components/scene/use-document-visible';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/i18n/routing';
import { BodyEditor } from './body-editor';
import { SimulationReadouts } from './simulation-readouts';
import type { SimulatorController } from './simulator-controller';
import { SimulatorControls, SimulatorPresets } from './simulator-controls';
import { useSimulatorState } from './use-simulator-state';

const SimulatorScene = dynamic(() => import('./scene/simulator-scene'), { ssr: false });
const READOUT_INTERVAL_MS = 200;

export function ThreeBodySimulator({ controller }: { controller: SimulatorController }) {
  const t = useTranslations('simulator');
  const [showVectors, setShowVectors] = useState(true);
  const visible = useDocumentVisible();
  const playing = useSimulatorState(controller, (state) => state.playing);
  const event = useSimulatorState(controller, (state) => state.event);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(controller.publish, READOUT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [controller, playing]);

  return (
    <div className="simulator-panel">
      <p className="simulator-intro">{t('intro')}</p>
      <SimulatorPresets controller={controller} />
      <div className="simulator-stage" role="group" aria-label={t('sceneLabel')}>
        <div className="simulator-scene" data-testid="simulator-scene">
          <SceneBoundary fallback={<p className="simulator-fallback">{t('fallback')}</p>}>
            <SimulatorScene controller={controller} showVectors={showVectors} visible={visible} />
          </SceneBoundary>
        </div>
        <p className="simulator-event" role="status">
          {event ? t(event) : null}
        </p>
      </div>
      <SimulatorControls
        controller={controller}
        showVectors={showVectors}
        onShowVectors={setShowVectors}
      />
      <SimulationReadouts controller={controller} />
      <BodyEditor controller={controller} />
      <p className="simulator-model">{t('model')}</p>
      <div className="simulator-next">
        <p>{t('next')}</p>
        <Link href={ROUTES.orbits} className="button">
          {t('explore')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
