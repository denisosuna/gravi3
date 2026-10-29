import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { SceneBoundary } from '@/shared/three/scene-boundary';
import { useDocumentVisible } from '@/shared/three/use-document-visible';
import type { SimulatorController } from '../state/simulator-controller';
import { SimulatorControls } from './simulator-controls';
import { useSimulatorState } from '../state/use-simulator-state';

const SimulatorScene = dynamic(() => import('./scene/simulator-scene'), { ssr: false });
const READOUT_INTERVAL_MS = 200;

// The live scene with its playback controls; capsules add presets, readouts or the editor around it.
export function SimulatorStage({ controller }: { controller: SimulatorController }) {
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
    <>
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
    </>
  );
}
