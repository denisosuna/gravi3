import { useTranslations } from 'next-intl';
import { Minus, Pause, Play, Plus, RotateCcw, Shuffle } from 'lucide-react';
import { SIMULATOR_PRESETS } from '@/data/simulator-presets';
import { SIMULATOR_SPEEDS, ZOOM_LEVELS, type SimulatorController } from './simulator-controller';
import { useSimulatorState } from './use-simulator-state';

export function SimulatorPresets({ controller }: { controller: SimulatorController }) {
  const t = useTranslations('simulator');
  const presetId = useSimulatorState(controller, (state) => state.presetId);
  return (
    <div className="simulator-presets" role="group" aria-label={t('presets')}>
      {SIMULATOR_PRESETS.map((preset) => (
        <button
          key={preset}
          className="preset-button"
          aria-pressed={presetId === preset}
          onClick={() => controller.loadPreset(preset)}
        >
          <strong>{t(`preset.${preset}.name`)}</strong>
          <small>{t(`preset.${preset}.hint`)}</small>
        </button>
      ))}
    </div>
  );
}

export function SimulatorControls({
  controller,
  showVectors,
  onShowVectors,
}: {
  controller: SimulatorController;
  showVectors: boolean;
  onShowVectors: (show: boolean) => void;
}) {
  const t = useTranslations('simulator');
  const playing = useSimulatorState(controller, (state) => state.playing);
  const speed = useSimulatorState(controller, (state) => state.speed);
  const zoomIndex = useSimulatorState(controller, (state) => state.zoomIndex);
  const halted = useSimulatorState(controller, (state) => state.event === 'collision');
  const zoomTo = (index: number) =>
    controller.update({ zoomIndex: Math.min(ZOOM_LEVELS.length - 1, Math.max(0, index)) });
  return (
    <div className="simulator-controls">
      <button
        className="control-button"
        disabled={halted}
        onClick={() => controller.update({ playing: !playing })}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        <span>{t(playing ? 'pause' : 'play')}</span>
      </button>
      <button className="control-button" onClick={() => controller.reset()}>
        <RotateCcw size={16} aria-hidden="true" />
        <span>{t('reset')}</span>
      </button>
      <button
        className="control-button"
        title={t('perturbHint')}
        onClick={() => controller.perturb()}
      >
        <Shuffle size={16} aria-hidden="true" />
        <span>{t('perturb')}</span>
      </button>
      <select
        className="speed-control"
        aria-label={t('speed')}
        value={speed}
        onChange={(event) => {
          const selected = SIMULATOR_SPEEDS.find((option) => option === Number(event.target.value));
          if (selected) controller.update({ speed: selected });
        }}
      >
        {SIMULATOR_SPEEDS.map((option) => (
          <option key={option} value={option}>
            {option}×
          </option>
        ))}
      </select>
      <div className="zoom-control" role="group" aria-label={t('zoom')}>
        <button
          className="icon-button"
          aria-label={t('zoomOut')}
          disabled={zoomIndex === 0}
          onClick={() => zoomTo(zoomIndex - 1)}
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <output>{Math.round((ZOOM_LEVELS[zoomIndex] ?? 1) * 100)}%</output>
        <button
          className="icon-button"
          aria-label={t('zoomIn')}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          onClick={() => zoomTo(zoomIndex + 1)}
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
      <label className="trace-toggle">
        <input
          type="checkbox"
          checked={showVectors}
          onChange={(event) => onShowVectors(event.target.checked)}
        />
        {t('vectors')}
      </label>
    </div>
  );
}
