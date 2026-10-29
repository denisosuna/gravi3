import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Group } from 'three';
import { samplePositions } from '@/physics/interpolation';
import { BODY_INDICES, bodyPosition, type Trajectory } from '@/physics/types';
import { LiquidBody, LiquidEnvironment } from '@/shared/three/liquid-body';
import { LIQUID_BODIES } from '@/shared/three/liquid-marble';

const SECONDS_PER_PERIOD = 9;
// Reduced motion and the first paint show the bodies well apart.
const START_PERIOD_FRACTION = 0.15;
const CAMERA_DISTANCE = 5;
const FIELD_OF_VIEW_DEGREES = 40;
const VIEWPORT_FILL = 0.8;
const BODY_RADIUS = 0.24;
// A slight tilt shows the bodies as spheres in space; the orbit itself stays planar.
const TILT_RADIANS = -0.45;
const PATH_OPACITY = 0.35;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

function useFit(trajectory: Trajectory) {
  const { size } = useThree();
  return useMemo(() => {
    const positions = trajectory.samples.flatMap((sample) =>
      BODY_INDICES.map((body) => bodyPosition(sample.state, body)),
    );
    const extentX = Math.max(...positions.map(([x]) => Math.abs(x)));
    const extentY = Math.max(...positions.map(([, y]) => Math.abs(y)));
    const halfHeight = CAMERA_DISTANCE * Math.tan((FIELD_OF_VIEW_DEGREES / 2) * (Math.PI / 180));
    const halfWidth = halfHeight * (size.width / size.height);
    const scale = VIEWPORT_FILL * Math.min(halfWidth / extentX, halfHeight / extentY);
    const paths = BODY_INDICES.map((body) =>
      trajectory.samples.map((sample): [number, number, number] => {
        const [x, y] = bodyPosition(sample.state, body);
        return [x * scale, y * scale, 0];
      }),
    );
    return { scale, paths };
  }, [trajectory, size.width, size.height]);
}

function HeroBodies({ trajectory, paused }: { trajectory: Trajectory; paused: boolean }) {
  const { scale, paths } = useFit(trajectory);
  const groups = useRef<(Group | null)[]>([]);
  const time = useRef(trajectory.period * START_PERIOD_FRACTION);
  const positions = useMemo(() => Array<number>(2 * BODY_INDICES.length).fill(0), []);
  useFrame((_, delta) => {
    if (!paused)
      time.current =
        (time.current + (delta * trajectory.period) / SECONDS_PER_PERIOD) % trajectory.period;
    samplePositions(trajectory, time.current, positions);
    for (const body of BODY_INDICES)
      groups.current[body]?.position.set(
        positions[2 * body]! * scale,
        positions[2 * body + 1]! * scale,
        0,
      );
  });
  return (
    <group rotation={[TILT_RADIANS, 0, 0]}>
      {paths.map((points, body) => (
        <Line
          key={body}
          points={points}
          color={LIQUID_BODIES[body]!.base}
          lineWidth={1}
          transparent
          opacity={PATH_OPACITY}
        />
      ))}
      {BODY_INDICES.map((body) => (
        <group
          key={body}
          ref={(group) => {
            groups.current[body] = group;
          }}
        >
          <LiquidBody index={body} radius={BODY_RADIUS} />
        </group>
      ))}
    </group>
  );
}

// The real figure-eight trajectory with the bodies in liquid marble; loaded after the static preview.
export default function HeroOrbitScene({
  trajectory,
  paused,
  visible,
  onReady,
}: {
  trajectory: Trajectory;
  paused: boolean;
  visible: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: FIELD_OF_VIEW_DEGREES }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      frameloop={!paused && visible ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true }}
      onCreated={onReady}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[-3, 4, 6]} intensity={1.6} />
      <LiquidEnvironment />
      <HeroBodies trajectory={trajectory} paused={paused} />
    </Canvas>
  );
}
