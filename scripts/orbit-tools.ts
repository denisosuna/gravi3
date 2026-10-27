import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { invariants } from '../src/physics/gravity';
import { integrate } from '../src/physics/integrator';
import { interpolatePosition, samplePositions } from '../src/physics/interpolation';
import type { OrbitDefinition, Sample, Trajectory } from '../src/physics/types';

const PUBLIC_DIR = 'public';
export const publicAssetPath = (asset: string) => join(PUBLIC_DIR, asset);

export const thresholds = {
  returnError: 1e-6,
  energy: 1e-8,
  conserved: 1e-8,
  convergence: 1e-7,
  interpolation: 1e-5,
};

function difference(a: readonly number[], b: readonly number[]) {
  return Math.max(...a.map((value, i) => Math.abs(value - b[i]!)));
}

export function compressSamples(samples: Sample[], period: number): Sample[] {
  const selected = new Set([0, samples.length - 1]);
  function split(start: number, end: number) {
    if (end - start < 2) return;
    const a = samples[start]!;
    const b = samples[end]!;
    let maximum = 0;
    let index = (start + end) >>> 1;
    for (let i = start + 1; i < end; i++) {
      const sample = samples[i]!;
      for (let coordinate = 0; coordinate < 6; coordinate++) {
        const error = Math.abs(
          interpolatePosition(a, b, sample.time, coordinate) - sample.state[coordinate]!,
        );
        if (error > maximum) {
          maximum = error;
          index = i;
        }
      }
    }
    if (maximum <= 1e-6 && b.time - a.time <= period / 128) return;
    selected.add(index);
    split(start, index);
    split(index, end);
  }
  split(0, samples.length - 1);
  return [...selected].sort((a, b) => a - b).map((index) => samples[index]!);
}

export function diagnose(definition: OrbitDefinition, trajectory: Trajectory) {
  const base = invariants(
    definition.initialState,
    definition.masses,
    definition.gravitationalConstant,
  );
  const reference = integrate(definition.initialState, definition.masses, definition.period, {
    tolerance: 1e-13,
    gravitationalConstant: definition.gravitationalConstant,
  });
  const loose = integrate(definition.initialState, definition.masses, definition.period, {
    tolerance: 1e-11,
    gravitationalConstant: definition.gravitationalConstant,
  });
  let relativeEnergyDrift = 0;
  let conservedDrift = 0;
  let minimumDistance = Infinity;
  let interpolationError = 0;
  const target: number[] = [];
  for (const sample of [...reference, ...trajectory.samples]) {
    const values = invariants(sample.state, definition.masses, definition.gravitationalConstant);
    relativeEnergyDrift = Math.max(
      relativeEnergyDrift,
      Math.abs((values.energy - base.energy) / base.energy),
    );
    for (const key of [
      'momentumX',
      'momentumY',
      'angularMomentum',
      'centerX',
      'centerY',
    ] as const) {
      conservedDrift = Math.max(conservedDrift, Math.abs(values[key] - base[key]));
    }
    minimumDistance = Math.min(minimumDistance, values.minimumDistance);
    samplePositions(trajectory, sample.time, target);
    interpolationError = Math.max(interpolationError, difference(target, sample.state.slice(0, 6)));
  }
  const end = trajectory.samples.at(-1)!.state;
  const metrics = {
    positionReturn: difference(end.slice(0, 6), definition.initialState.slice(0, 6)),
    velocityReturn: difference(end.slice(6), definition.initialState.slice(6)),
    relativeEnergyDrift,
    conservedDrift,
    minimumDistance,
    interpolationError,
    convergence: difference(end, loose.at(-1)!.state),
    samples: trajectory.samples.length,
    referenceSteps: reference.length - 1,
    gzipBytes: gzipSync(JSON.stringify(trajectory)).byteLength,
  };
  if (
    metrics.positionReturn > thresholds.returnError ||
    metrics.velocityReturn > thresholds.returnError ||
    relativeEnergyDrift > thresholds.energy ||
    conservedDrift > thresholds.conserved ||
    metrics.convergence > thresholds.convergence ||
    interpolationError > thresholds.interpolation
  ) {
    throw new Error(`${definition.slug} failed scientific acceptance: ${JSON.stringify(metrics)}`);
  }
  return metrics;
}

// Light-theme Okabe-Ito colors keep at least 3:1 contrast on both the light and dark pages.
const PREVIEW_COLORS = ['#0072b2', '#d55e00', '#009e73'];
const PREVIEW_SIZE = { width: 160, height: 100, margin: 8 } as const;
const PREVIEW_SAMPLES = 480;
const PREVIEW_HEAD = 40;
const PREVIEW_TRAIL = 160;

// Each orbit is framed on its own extent so flat orbits fill the width instead of shrinking.
export function previewSvg(trajectory: Trajectory): string {
  const positions = Array.from({ length: PREVIEW_SAMPLES + 1 }, (_, i) =>
    samplePositions(trajectory, (i / PREVIEW_SAMPLES) * trajectory.period, []),
  );
  const coordinates = (axis: 0 | 1) =>
    positions.flatMap((position) => [0, 1, 2].map((body) => Math.abs(position[2 * body + axis]!)));
  const { width, height, margin } = PREVIEW_SIZE;
  const scale = Math.min(
    (width / 2 - margin) / Math.max(...coordinates(0)),
    (height / 2 - margin) / Math.max(...coordinates(1)),
  );
  const point = (position: number[], body: number) =>
    `${(width / 2 + position[2 * body]! * scale).toFixed(2)},${(height / 2 - position[2 * body + 1]! * scale).toFixed(2)}`;
  const paths = PREVIEW_COLORS.map((color, body) => {
    const orbit = positions.map((position) => point(position, body)).join(' ');
    const trail = Array.from({ length: PREVIEW_TRAIL + 1 }, (_, i) => {
      const index = (PREVIEW_HEAD - PREVIEW_TRAIL + i + PREVIEW_SAMPLES) % PREVIEW_SAMPLES;
      return point(positions[index]!, body);
    }).join(' ');
    const [x, y] = point(positions[PREVIEW_HEAD]!, body).split(',');
    return `<polyline points="${orbit}" fill="none" stroke="${color}" stroke-width=".5" opacity=".3"/><polyline points="${trail}" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="2.4" fill="${color}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${paths}</svg>`;
}
