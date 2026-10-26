import { useLayoutEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import { useTheme } from 'next-themes';
import { Vector3 } from 'three';
import type { Experiment } from '@/data/experiment';
import { forceLabLayout, VISIBLE_HALF_WIDTH } from './force-lab-layout';
import { scenePalette } from './scene-palette';

const CAMERA_POSITION: [number, number, number] = [0, 0.7, 4];
const MIN_CAMERA_DISTANCE = 3.2;
const FIELD_OF_VIEW_DEGREES = 40;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
// Arrows sit above and below the bodies so they stay readable even when the bodies are close.
const ARROW_OFFSET_Y = 0.55;
const RULER_OFFSET_Y = -0.75;
const RULER_TICK = 0.08;
// Camera may swing sideways and tilt a little, never below the floor or upside down.
const POLAR_RANGE = { min: Math.PI / 2 - 0.6, max: Math.PI / 2 + 0.15 } as const;
const RIGHT = new Vector3(1, 0, 0);
const LEFT = new Vector3(-1, 0, 0);

function ForceArrow({
  x,
  y,
  direction,
  length,
  color,
}: {
  x: number;
  y: number;
  direction: Vector3;
  length: number;
  color: string;
}) {
  const origin = useMemo(() => new Vector3(x, y, 0), [x, y]);
  return <arrowHelper args={[direction, origin, length, color, length * 0.28, length * 0.16]} />;
}

// Moves the camera back on narrow screens so the largest distance always fits horizontally.
function CameraFit() {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    const halfFov = (FIELD_OF_VIEW_DEGREES / 2) * (Math.PI / 180);
    const aspect = size.width / size.height;
    const distance = Math.max(
      MIN_CAMERA_DISTANCE,
      VISIBLE_HALF_WIDTH / (Math.tan(halfFov) * aspect),
    );
    camera.position.setLength(distance);
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}

function DistanceRuler({ left, right, color }: { left: number; right: number; color: string }) {
  const y = RULER_OFFSET_Y;
  return (
    <group>
      <Line
        points={[
          [left, y, 0],
          [right, y, 0],
        ]}
        color={color}
        lineWidth={1}
      />
      {[left, right].map((x) => (
        <Line
          key={x}
          points={[
            [x, y - RULER_TICK, 0],
            [x, y + RULER_TICK, 0],
          ]}
          color={color}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

export default function ForceLabScene({
  experiment,
  force,
  onContextLost,
}: {
  experiment: Experiment;
  force: number;
  onContextLost: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const palette = scenePalette(resolvedTheme === 'dark');
  const { positions, radii, arrowLength } = forceLabLayout(experiment, force);
  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: FIELD_OF_VIEW_DEGREES }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[-3, 4, 6]} intensity={2.2} />
      <gridHelper
        args={[10, 20, palette.gridCenter, palette.grid]}
        position={[0, RULER_OFFSET_Y - 0.4, 0]}
      />
      {positions.map((x, body) => (
        <group key={body} position={[x, 0, 0]}>
          <mesh>
            <sphereGeometry args={[radii[body]!, 32, 24]} />
            <meshStandardMaterial
              color={palette.bodies[body]}
              emissive={palette.bodies[body]}
              emissiveIntensity={0.25}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}
      <ForceArrow
        x={positions[0]}
        y={ARROW_OFFSET_Y}
        direction={RIGHT}
        length={arrowLength}
        color={palette.bodies[0]}
      />
      <ForceArrow
        x={positions[1]}
        y={-ARROW_OFFSET_Y}
        direction={LEFT}
        length={arrowLength}
        color={palette.bodies[1]}
      />
      <DistanceRuler left={positions[0]} right={positions[1]} color={palette.ruler} />
      <CameraFit />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping={false}
        minPolarAngle={POLAR_RANGE.min}
        maxPolarAngle={POLAR_RANGE.max}
      />
    </Canvas>
  );
}
