import { expect, it } from 'vitest';
import { PlaybackController } from './playback';

it('keeps physical time continuous through speed, pause, seek and reset', () => {
  const player = new PlaybackController(10);
  player.update({ playing: true });
  player.advance(0.04);
  const before = player.time;
  player.update({ speed: 2 });
  expect(player.time).toBe(before);
  player.advance(0.04);
  expect(player.time).toBeCloseTo(before * 3);
  player.update({ playing: false });
  player.advance(0.04);
  expect(player.time).toBeCloseTo(before * 3);
  player.update({ time: 8 });
  expect(player.time).toBe(8);
  player.reset();
  expect(player.time).toBe(0);
});

it('bounds resumed-tab deltas and wraps periods while preserving a session', () => {
  const player = new PlaybackController(10);
  player.update({ playing: true, time: 9.99, view: '3d' });
  player.advance(100);
  expect(player.time).toBeCloseTo(0.015);
  const restored = new PlaybackController(10, player.export());
  expect(restored.time).toBe(player.time);
  expect(restored.snapshot().view).toBe('3d');
});
