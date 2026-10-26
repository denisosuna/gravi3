'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pause, Play, RotateCcw, ScanLine } from 'lucide-react';
import type { PlaybackController } from './playback';

export function PlayerControls({ controller }: { controller: PlaybackController }) {
  const t = useTranslations('player');
  const locale = useLocale();
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(controller.publish, 150);
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
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </div>
      <div className="timeline">
        <input
          aria-label={t('timeline')}
          type="range"
          min={0}
          max={controller.period}
          step={controller.period / 2000}
          value={state.time}
          onChange={(event) => controller.update({ time: Number(event.target.value) })}
          aria-valuetext={`${format.format(state.time)} / ${format.format(controller.period)}`}
        />
        <output>
          {format.format((state.time / controller.period) * 20)} / {format.format(20)}{' '}
          {t('seconds')}
        </output>
      </div>
    </div>
  );
}

export function ViewControls({ controller }: { controller: PlaybackController }) {
  const t = useTranslations('player');
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  return (
    <div className="view-controls">
      <div className="segmented-control">
        <button aria-pressed={state.view === 'front'} onClick={() => controller.setView('front')}>
          {t('front')}
        </button>
        <button aria-pressed={state.view === '3d'} onClick={() => controller.setView('3d')}>
          {t('threeD')}
        </button>
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
