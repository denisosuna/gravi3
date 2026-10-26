import { gzipSync } from 'node:zlib';
import { invariants } from '../src/physics/gravity';
import { integrate } from '../src/physics/integrator';
import { interpolatePosition, samplePositions } from '../src/physics/interpolation';
import type { OrbitDefinition, Sample, Trajectory } from '../src/physics/types';

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

export function previewSvg(trajectory: Trajectory): string {
  const positions = Array.from({ length: 481 }, (_, i) =>
    samplePositions(trajectory, (i / 480) * trajectory.period, []),
  );
  const extent = Math.max(...positions.flat().map(Math.abs)) * 1.15;
  const scale = 48 / extent;
  const colors = ['#377dff', '#f5a742', '#a45bff'];
  const paths = colors
    .map((color, body) => {
      const points = positions
        .map(
          (position) =>
            `${(64 + position[2 * body]! * scale).toFixed(2)},${(56 - position[2 * body + 1]! * scale).toFixed(2)}`,
        )
        .join(' ');
      const head = positions[40]!;
      const trail = Array.from({ length: 161 }, (_, i) => {
        const time = (((40 - 160 + i + 480) % 480) / 480) * trajectory.period;
        const position = samplePositions(trajectory, time, []);
        return `${(64 + position[2 * body]! * scale).toFixed(2)},${(56 - position[2 * body + 1]! * scale).toFixed(2)}`;
      }).join(' ');
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width=".6" opacity=".15"/><polyline points="${trail}" fill="none" stroke="${color}" stroke-width="1.1" opacity=".9"/><circle cx="${64 + head[2 * body]! * scale}" cy="${56 - head[2 * body + 1]! * scale}" r="3" fill="${color}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 112">${paths}</svg>`;
}
