import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { numberFormat } from '@/shared/i18n/number-format';
import { SceneBoundary } from '@/shared/three/scene-boundary';
import {
  isSimulatorPreset,
  type SimulatorStart,
} from '@/features/learning/model/simulator-presets';
import { useDocumentVisible } from '@/shared/three/use-document-visible';
import type { SimulatorController } from '../state/simulator-controller';
import { SimulatorControls } from './simulator-controls';
import { useSimulatorState } from '../state/use-simulator-state';

const SimulatorScene = dynamic(() => import('./scene/simulator-scene'), { ssr: false });
const READOUT_INTERVAL_MS = 200;
const DIVERGENCE_DIGITS = 2;

// Presets and gallery orbits are named in different message groups.
function useStartName() {
  const presets = useTranslations('simulator.preset');
  const orbits = useTranslations('orbits');
  return (start: SimulatorStart) =>
    isSimulatorPreset(start) ? presets(`${start}.name`) : orbits(`${start}.name`);
}

// The live scene with its playback controls; capsules add presets, readouts or the editor around it.
export function SimulatorStage({ controller }: { controller: SimulatorController }) {
  const t = useTranslations('simulator');
  const [showVectors, setShowVectors] = useState(true);
  const visible = useDocumentVisible();
  const playing = useSimulatorState(controller, (state) => state.playing);
  const event = useSimulatorState(controller, (state) => state.event);
  const divergence = useSimulatorState(controller, (state) => state.divergence);
  const original = useSimulatorState(controller, (state) => state.original);
  const originalStopped = useSimulatorState(controller, (state) => state.originalStopped);
  const startName = useStartName();
  const distance = numberFormat(useLocale(), { maximumFractionDigits: DIVERGENCE_DIGITS });

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
        {original === null ? null : (
          <p className="simulator-comparison" data-testid="simulator-comparison">
            {originalStopped
              ? t('comparisonStopped', { name: startName(original) })
              : t('comparison', {
                  name: startName(original),
                  distance: distance.format(divergence ?? 0),
                })}
          </p>
        )}
      </div>
      <SimulatorControls
        controller={controller}
        showVectors={showVectors}
        onShowVectors={setShowVectors}
      />
    </>
  );
}
