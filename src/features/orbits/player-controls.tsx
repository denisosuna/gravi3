import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pause, Play, RotateCcw, ScanLine } from 'lucide-react';
import {
  CAMERA_VIEWS,
  PLAYBACK_SPEEDS,
  SECONDS_PER_PERIOD,
  type PlaybackController,
} from './playback';
import { usePlaybackState } from './use-playback-state';

const PUBLISH_INTERVAL_MS = 150;
const TIMELINE_STEPS = 2000;
const VIEW_LABELS = { front: 'front', '3d': 'threeD' } as const;

export function PlayerControls({ controller }: { controller: PlaybackController }) {
  const t = useTranslations('player');
  const locale = useLocale();
  const state = usePlaybackState(controller);
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(controller.publish, PUBLISH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [controller, state.playing]);
  const format = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <div className="player-controls">
      <div className="transport-controls">
        <button
          className="control-button"
          onClick={() => controller.update({ playing: !state.playing })}
          aria-label={t(state.playing ? 'pause' : 'play')}
        >
          {state.playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{t(state.playing ? 'pause' : 'play')}</span>
        </button>
        <button className="control-button" onClick={() => controller.reset()}>
          <RotateCcw size={16} />
          <span>{t('reset')}</span>
        </button>
        <select
          className="speed-control"
          aria-label={t('speed')}
          value={state.speed}
          onChange={(event) => controller.update({ speed: Number(event.target.value) })}
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
      </div>
      <div className="timeline">
        <input
          aria-label={t('timeline')}
          type="range"
          min={0}
          max={controller.period}
          step={controller.period / TIMELINE_STEPS}
          value={state.time}
          onChange={(event) => controller.update({ time: Number(event.target.value) })}
          aria-valuetext={`${format.format(state.time)} / ${format.format(controller.period)}`}
        />
        <output>
          {format.format((state.time / controller.period) * SECONDS_PER_PERIOD)} /{' '}
          {format.format(SECONDS_PER_PERIOD)} {t('seconds')}
        </output>
      </div>
    </div>
  );
}

export function ViewControls({ controller }: { controller: PlaybackController }) {
  const t = useTranslations('player');
  const state = usePlaybackState(controller);
  return (
    <div className="view-controls">
      <div className="segmented-control">
        {CAMERA_VIEWS.map((view) => (
          <button
            key={view}
            aria-pressed={state.view === view}
            onClick={() => controller.setView(view)}
          >
            {t(VIEW_LABELS[view])}
          </button>
        ))}
      </div>
      <button
        className="icon-button"
        onClick={() => controller.resetCamera()}
        aria-label={t('resetCamera')}
        title={t('resetCamera')}
      >
        <ScanLine size={17} />
      </button>
      <label className="trace-toggle">
        <input
          type="checkbox"
          checked={state.traces}
          onChange={(event) => controller.update({ traces: event.target.checked })}
        />
        {t('traces')}
      </label>
    </div>
  );
}
