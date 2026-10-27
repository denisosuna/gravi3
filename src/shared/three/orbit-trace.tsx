'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ASSETS } from '@/shared/constants/routes';
import { findOrbit } from '@/physics/orbit-catalog';
import { samplePositions } from '@/physics/interpolation';
import { parseTrajectory } from '@/physics/trajectory-schema';
import { BODY_INDICES, bodyPosition, type OrbitSlug, type Trajectory } from '@/physics/types';
import { useDocumentVisible } from '@/shared/three/use-document-visible';

const SECONDS_PER_PERIOD = 8;
// Reduced motion shows a single still frame where the bodies are well apart.
const STILL_PERIOD_FRACTION = 0.15;
const TRAIL_PERIOD_FRACTION = 0.2;
const PATH_POINTS = 360;
const BODY_RADIUS_PX = 6;
const VIEWPORT_FILL = 0.88;
const BODY_COLOR_TOKENS = ['--body-1', '--body-2', '--body-3'] as const;
const PATH_COLOR_TOKEN = '--line';

interface Frame {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number;
}

interface Extent {
  x: number;
  y: number;
}

function prepareFrame(canvas: HTMLCanvasElement, extent: Extent): Frame | undefined {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const context = canvas.getContext('2d');
  if (!context || width === 0 || height === 0) return undefined;
  if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
  if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return {
    context,
    width,
    height,
    scale: (Math.min(width / extent.x, height / extent.y) * VIEWPORT_FILL) / 2,
  };
}

interface TimeSpan {
  from: number;
  to: number;
}

function tracePath(frame: Frame, trajectory: Trajectory, body: number, { from, to }: TimeSpan) {
  const { context, width, height, scale } = frame;
  const positions = Array<number>(6).fill(0);
  const steps = Math.max(2, Math.round(((to - from) / trajectory.period) * PATH_POINTS));
  context.beginPath();
  for (let step = 0; step <= steps; step++) {
    const time = (from + ((to - from) * step) / steps + trajectory.period) % trajectory.period;
    samplePositions(trajectory, time, positions);
    const x = width / 2 + positions[2 * body]! * scale;
    const y = height / 2 - positions[2 * body + 1]! * scale;
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function drawOrbit(frame: Frame, trajectory: Trajectory, time: number, colors: string[]) {
  const { context, width, height, scale } = frame;
  const trail = trajectory.period * TRAIL_PERIOD_FRACTION;
  const positions = samplePositions(trajectory, time, Array<number>(6).fill(0));
  // Full orbits first, so no orbit is painted over another body's trail.
  context.lineWidth = 1.5;
  context.strokeStyle = colors[3]!;
  for (const body of BODY_INDICES)
    tracePath(frame, trajectory, body, { from: 0, to: trajectory.period });
  context.lineWidth = 3;
  for (const body of BODY_INDICES) {
    context.strokeStyle = colors[body]!;
    tracePath(frame, trajectory, body, { from: time - trail, to: time });
  }
  for (const body of BODY_INDICES) {
    context.fillStyle = colors[body]!;
    context.beginPath();
    const x = width / 2 + positions[2 * body]! * scale;
    const y = height / 2 - positions[2 * body + 1]! * scale;
    context.arc(x, y, BODY_RADIUS_PX, 0, 2 * Math.PI);
    context.fill();
  }
}

function useTrajectory(slug: OrbitSlug): Trajectory | undefined {
  const [trajectory, setTrajectory] = useState<Trajectory>();
  useEffect(() => {
    const orbit = findOrbit(slug);
    if (!orbit) return;
    const abort = new AbortController();
    fetch(ASSETS.orbitTrajectory(slug), { signal: abort.signal })
      .then(async (response) => {
        if (response.ok) setTrajectory(parseTrajectory(await response.json(), orbit));
      })
      // The static preview stays visible if the data cannot load.
      .catch(() => undefined);
    return () => abort.abort();
  }, [slug]);
  return trajectory;
}

// Fraction of the period to draw at a frame timestamp, in [0, 1); lets traces share one clock.
export type PhaseSource = (now: number) => number;

// The real, validated trajectory in motion; the static preview is shown until it loads.
export function OrbitTrace({
  slug,
  width,
  height,
  phase,
}: {
  slug: OrbitSlug;
  width: number;
  height: number;
  // Without a source the trace runs on its own clock, or stays still under reduced motion.
  phase?: PhaseSource;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const trajectory = useTrajectory(slug);
  const visible = useDocumentVisible();
  const { resolvedTheme } = useTheme();
  // Largest distance from the center along each axis, so tall and flat orbits both fit.
  const extent = useMemo<Extent>(() => {
    const positions = (trajectory?.samples ?? []).flatMap((sample) =>
      BODY_INDICES.map((body) => bodyPosition(sample.state, body)),
    );
    return {
      x: Math.max(1e-9, ...positions.map(([x]) => Math.abs(x))),
      y: Math.max(1e-9, ...positions.map(([, y]) => Math.abs(y))),
    };
  }, [trajectory]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !trajectory || !visible) return;
    const style = getComputedStyle(element);
    const colors = [...BODY_COLOR_TOKENS, PATH_COLOR_TOKEN].map((token) =>
      style.getPropertyValue(token).trim(),
    );
    const render = (time: number) => {
      const frame = prepareFrame(element, extent);
      if (frame) drawOrbit(frame, trajectory, time, colors);
    };
    if (!phase && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(trajectory.period * STILL_PERIOD_FRACTION);
      return;
    }
    const fractionAt = phase ?? ((now: number) => (now / 1000 / SECONDS_PER_PERIOD) % 1);
    let request = 0;
    const loop = (now: number) => {
      render(fractionAt(now) * trajectory.period);
      request = requestAnimationFrame(loop);
    };
    request = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(request);
  }, [trajectory, visible, extent, resolvedTheme, phase]);

  return (
    <div className="orbit-trace" data-ready={trajectory ? 'true' : undefined}>
      <Image src={ASSETS.orbitPreview(slug)} alt="" width={width} height={height} priority />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
