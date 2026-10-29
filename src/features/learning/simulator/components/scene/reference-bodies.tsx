import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import type { SimulatorController } from '@/features/learning/simulator/state/simulator-controller';
import { BODY_INDICES, bodyPosition } from '@/physics/types';
import { bodyRadius } from './simulator-bodies';
import { createTrail, pushTrailPoint } from './trail';

// The original run is drawn as faint ghosts, so the edited run reads as the solid one.
const GHOST_OPACITY = 0.28;
const GHOST_TRAIL_OPACITY = 0.3;

// Remounted with the main bodies on every restart; drawn only while an original is compared.
export function ReferenceBodies({
  controller,
  colors,
}: {
  controller: SimulatorController;
  colors: readonly string[];
}) {
  const meshes = useRef<(Mesh | null)[]>([]);
  const trails = useMemo(
    () => colors.map((color) => createTrail(color, GHOST_TRAIL_OPACITY)),
    [colors],
  );
  const reference = controller.reference;

  useEffect(
    () => () =>
      trails.forEach((trail) => {
        trail.geometry.dispose();
        trail.material.dispose();
      }),
    [trails],
  );

  // Runs after the main bodies, which advance both simulations in the same frame.
  useFrame(() => {
    if (!reference) return;
    for (const body of BODY_INDICES) {
      const [x, y] = bodyPosition(reference.state, body);
      meshes.current[body]?.position.set(x, y, -0.05);
      pushTrailPoint(trails[body]!, x, y);
    }
  });

  if (!reference) return null;
  return (
    <>
      {trails.map((trail, body) => (
        <primitive object={trail} key={`ghost-trail-${body}`} />
      ))}
      {colors.map((color, body) => (
        <mesh
          key={`ghost-${color}`}
          ref={(mesh) => {
            meshes.current[body] = mesh;
          }}
        >
          <sphereGeometry args={[bodyRadius(reference.masses[body]!), 24, 16]} />
          <meshBasicMaterial color={color} transparent opacity={GHOST_OPACITY} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
