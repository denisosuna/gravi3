import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line as ThreeLine,
  LineBasicMaterial,
} from 'three';
import type { PlaybackController } from '../playback';
import { samplePositions } from '@/physics/interpolation';
import { BODY_INDICES, type Trajectory } from '@/physics/types';
import { createBodyLabels } from '@/components/scene/body-labels';

const TRAIL_SEGMENTS = 128;
// Each moving trail covers the most recent third of a period.
const TRAIL_PERIOD_FRACTION = 1 / 3;
const TRAIL_DEPTH = 0.002;
const TRAIL_OPACITY = 0.75;
const BODY_RADIUS = 0.065;
const GLOW_LAYERS = [
  { radius: 0.105, opacity: 0.11 },
  { radius: 0.145, opacity: 0.035 },
] as const;

function createTrail(color: string): ThreeLine<BufferGeometry, LineBasicMaterial> {
  const geometry = new BufferGeometry();
  const positions = new Float32Array((TRAIL_SEGMENTS + 1) * 3);
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const material = new LineBasicMaterial({ color, transparent: true, opacity: TRAIL_OPACITY });
  return new ThreeLine(geometry, material);
}

export function MovingBodies({
  trajectory,
  controller,
  scale,
  colors,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  scale: number;
  colors: readonly string[];
}) {
  const labels = useMemo(() => createBodyLabels(BODY_INDICES.length), []);
  useEffect(() => () => labels.forEach((label) => label.dispose()), [labels]);
  const groups = useRef<(Group | null)[]>([]);
  const positions = useMemo(() => Array<number>(2 * BODY_INDICES.length).fill(0), []);
  const trails = useMemo(() => colors.map(createTrail), [colors]);
  useEffect(
    () => () => {
      trails.forEach((trail) => {
        trail.geometry.dispose();
        trail.material.dispose();
      });
    },
    [trails],
  );

  useFrame((_, delta) => {
    if (!document.hidden) controller.advance(delta);
    const { period } = trajectory;
    samplePositions(trajectory, controller.time, positions);
    for (const body of BODY_INDICES)
      groups.current[body]?.position.set(
        positions[2 * body]! * scale,
        positions[2 * body + 1]! * scale,
        0,
      );
    for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
      const lag = (1 - i / TRAIL_SEGMENTS) * period * TRAIL_PERIOD_FRACTION;
      samplePositions(trajectory, (controller.time - lag + period) % period, positions);
      for (const body of BODY_INDICES)
        trails[body]!.geometry.attributes.position!.setXYZ(
          i,
          positions[2 * body]! * scale,
          positions[2 * body + 1]! * scale,
          TRAIL_DEPTH,
        );
    }
    const { traces } = controller.snapshot();
    trails.forEach((trail) => {
      trail.visible = traces;
      trail.geometry.attributes.position!.needsUpdate = true;
      trail.geometry.computeBoundingSphere();
    });
  });

  return (
    <>
      {trails.map((trail, i) => (
        <primitive object={trail} key={`trail-${i}`} />
      ))}
      {colors.map((color, body) => (
        <group
          key={color}
          ref={(group) => {
            groups.current[body] = group;
          }}
        >
          <sprite position={[0.13, 0.13, 0.04]} scale={[0.14, 0.14, 1]}>
            <spriteMaterial map={labels[body]} depthTest={false} />
          </sprite>
          <mesh>
            <sphereGeometry args={[BODY_RADIUS, 24, 20]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.7}
              roughness={0.25}
            />
          </mesh>
          {GLOW_LAYERS.map(({ radius, opacity }) => (
            <mesh key={radius}>
              <sphereGeometry args={[radius, 16, 12]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
