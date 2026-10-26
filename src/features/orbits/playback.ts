import type { OrbitSession } from '@/components/providers';

export class PlaybackController {
  private value: OrbitSession;
  private frameTime: number;
  private listeners = new Set<() => void>();
  cameraRevision = 0;

  constructor(
    readonly period: number,
    initial?: OrbitSession,
  ) {
    this.value = initial ?? { time: 0, speed: 1, playing: false, view: 'front', traces: true };
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
          Math.min(Math.max(0, delta), 0.05) * (this.period / 20) * this.value.speed) %
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
  setView(view: OrbitSession['view']) {
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
