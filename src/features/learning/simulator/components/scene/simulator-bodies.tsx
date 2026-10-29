import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  ArrowHelper,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line as ThreeLine,
  LineBasicMaterial,
  Vector3,
} from 'three';
import type { SimulatorController } from '@/features/learning/simulator/state/simulator-controller';
import { BODY_INDICES, bodyPosition, bodyVelocity } from '@/physics/types';
import { LiquidBody } from '@/shared/three/liquid-body';

const TRAIL_POINTS = 900;
const TRAIL_OPACITY = 0.8;
// Body radius grows with the cube root of mass, clamped so tiny moons stay visible.
const RADIUS = { perCubeRoot: 0.1, min: 0.05, max: 0.22 } as const;
// Velocity arrows: world length per unit of speed, capped for very fast bodies.
const VELOCITY_ARROW = { scale: 0.35, max: 1.2, min: 0.001 } as const;

function bodyRadius(mass: number): number {
  return Math.min(RADIUS.max, Math.max(RADIUS.min, RADIUS.perCubeRoot * Math.cbrt(mass)));
}

function createTrail(color: string) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3));
  geometry.setDrawRange(0, 0);
  const material = new LineBasicMaterial({ color, transparent: true, opacity: TRAIL_OPACITY });
  const trail = new ThreeLine(geometry, material);
  // The trail moves every frame; skipping culling avoids recomputing its bounds each time.
  trail.frustumCulled = false;
  return trail;
}

// Trails are a sliding window of recent positions; older points shift out of the buffer.
function pushTrailPoint(trail: ThreeLine<BufferGeometry, LineBasicMaterial>, x: number, y: number) {
  const attribute = trail.geometry.attributes.position as BufferAttribute;
  const array = attribute.array as Float32Array;
  const count = trail.geometry.drawRange.count;
  if (count === TRAIL_POINTS) array.copyWithin(0, 3);
  const index = Math.min(count, TRAIL_POINTS - 1);
  array.set([x, y, 0], index * 3);
  trail.geometry.setDrawRange(0, Math.min(count + 1, TRAIL_POINTS));
  attribute.needsUpdate = true;
}

function updateVelocityArrow(
  arrow: ArrowHelper,
  direction: Vector3,
  [x, y, vx, vy]: readonly [number, number, number, number],
  show: boolean,
) {
  const speed = Math.hypot(vx, vy);
  arrow.visible = show && speed > VELOCITY_ARROW.min;
  if (!arrow.visible) return;
  arrow.position.set(x, y, 0.01);
  arrow.setDirection(direction.set(vx / speed, vy / speed, 0));
  arrow.setLength(Math.min(VELOCITY_ARROW.max, speed * VELOCITY_ARROW.scale), 0.08, 0.05);
}

// Remounted on every restart (keyed by revision), which clears trails and resizes bodies.
export function SimulatorBodies({
  controller,
  colors,
  showVectors,
}: {
  controller: SimulatorController;
  colors: readonly string[];
  showVectors: boolean;
}) {
  const groups = useRef<(Group | null)[]>([]);
  const trails = useMemo(() => colors.map(createTrail), [colors]);
  const arrows = useMemo(
    () =>
      colors.map(
        (color) => new ArrowHelper(new Vector3(1, 0, 0), new Vector3(), 0.1, color, 0.08, 0.05),
      ),
    [colors],
  );
  const direction = useMemo(() => new Vector3(), []);
  const invalidate = useThree((three) => three.invalidate);
  // A paused scene renders on demand, so toggling vectors must request a frame.
  useEffect(() => invalidate(), [showVectors, invalidate]);
  const masses = controller.simulation.masses;

  useEffect(
    () => () => {
      trails.forEach((trail) => {
        trail.geometry.dispose();
        trail.material.dispose();
      });
      arrows.forEach((arrow) => arrow.dispose());
    },
    [trails, arrows],
  );

  useFrame((_, delta) => {
    if (!document.hidden) controller.step(delta);
    const { state } = controller.simulation;
    for (const body of BODY_INDICES) {
      const [x, y] = bodyPosition(state, body);
      const [vx, vy] = bodyVelocity(state, body);
      groups.current[body]?.position.set(x, y, 0);
      pushTrailPoint(trails[body]!, x, y);
      updateVelocityArrow(arrows[body]!, direction, [x, y, vx, vy], showVectors);
    }
  });

  return (
    <>
      {trails.map((trail, body) => (
        <primitive object={trail} key={`trail-${body}`} />
      ))}
      {arrows.map((arrow, body) => (
        <primitive object={arrow} key={`arrow-${body}`} />
      ))}
      {colors.map((color, body) => (
        <group
          key={color}
          ref={(group) => {
            groups.current[body] = group;
          }}
        >
          <LiquidBody index={body} radius={bodyRadius(masses[body]!)} />
        </group>
      ))}
    </>
  );
}
