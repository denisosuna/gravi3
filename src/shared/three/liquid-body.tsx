import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { LIQUID_BODIES, liquidMaterial, liquidTime } from './liquid-marble';
import { useReducedMotion } from './use-reduced-motion';

// Enough segments for the ripple to stay smooth on the largest bodies.
const SEGMENTS = { width: 64, height: 48 } as const;
const ENVIRONMENT_RESOLUTION = 64;

// A body in liquid marble. `index` picks its colours, so body 1 always looks the same everywhere.
export function LiquidBody({ index, radius }: { index: number; radius: number }) {
  const material = liquidMaterial(LIQUID_BODIES[index % LIQUID_BODIES.length]!);
  const reduced = useReducedMotion();
  useFrame(() => {
    // A still frame under reduced motion; scenes that render on demand only move when they redraw.
    if (!reduced) liquidTime.value = performance.now() / 1000;
  });
  return (
    <mesh material={material} scale={radius}>
      <sphereGeometry args={[1, SEGMENTS.width, SEGMENTS.height]} />
    </mesh>
  );
}

// Reflections for the glossy bodies, built from light panels inside the scene: no file is fetched.
export function LiquidEnvironment() {
  return (
    <Environment resolution={ENVIRONMENT_RESOLUTION} frames={1}>
      <Lightformer intensity={2.2} position={[0, 4, 4]} scale={[6, 2, 1]} color="#cfeeff" />
      <Lightformer
        intensity={1.3}
        position={[-4, -1, 3]}
        scale={[3, 3, 1]}
        color="#ffc28a"
        form="ring"
      />
      <Lightformer intensity={1.1} position={[4, -2, -2]} scale={[4, 4, 1]} color="#9dffd9" />
    </Environment>
  );
}
