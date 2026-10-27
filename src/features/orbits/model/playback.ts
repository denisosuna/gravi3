import { MAX_FRAME_DELTA_SECONDS } from '@/shared/constants/animation';

export const CAMERA_VIEWS = ['front', '3d'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];
// Speeds offered by the orbit player; the tutor may only propose these.
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const;
// One orbital period lasts this many seconds of wall-clock playback at 1x.
export const SECONDS_PER_PERIOD = 20;

export interface OrbitSession {
  time: number;
  speed: number;
  playing: boolean;
  view: CameraView;
  traces: boolean;
  camera?: [number, number, number];
}

const INITIAL_SESSION: OrbitSession = {
  time: 0,
  speed: 1,
  playing: false,
  view: 'front',
  traces: true,
};

export class PlaybackController {
  private value: OrbitSession;
  private frameTime: number;
  private listeners = new Set<() => void>();
  cameraRevision = 0;

  constructor(
    readonly period: number,
    initial?: OrbitSession,
  ) {
    this.value = initial ?? INITIAL_SESSION;
    this.frameTime = this.value.time;
  }

  get time() {
    return this.frameTime;
  }
  snapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  update(patch: Partial<OrbitSession>) {
    if (patch.time !== undefined) this.frameTime = Math.max(0, Math.min(this.period, patch.time));
    this.value = { ...this.value, ...patch, time: this.frameTime };
    this.listeners.forEach((listener) => listener());
  }

  advance(delta: number) {
    if (this.value.playing)
      this.frameTime =
        (this.frameTime +
          Math.min(Math.max(0, delta), MAX_FRAME_DELTA_SECONDS) *
            (this.period / SECONDS_PER_PERIOD) *
            this.value.speed) %
        this.period;
  }

  publish = () => {
    if (this.frameTime !== this.value.time) this.update({});
  };
  reset() {
    this.update({ time: 0 });
  }
  resetCamera() {
    this.cameraRevision++;
    this.update({ camera: undefined });
  }
  setView(view: CameraView) {
    this.cameraRevision++;
    this.update({ view, camera: undefined });
  }
  saveCamera(camera: [number, number, number]) {
    this.update({ camera });
  }
  export(): OrbitSession {
    return { ...this.value, time: this.frameTime };
  }
}
