import { memo, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useTheme } from 'next-themes';
import type { PlaybackController } from '@/features/orbits/model/playback';
import { usePlaybackState } from '@/features/orbits/model/use-playback-state';
import { BODY_INDICES, bodyPosition, type Trajectory } from '@/physics/types';
import { CameraRig, INITIAL_CAMERA_POSITION } from './camera-rig';
import { MovingBodies } from './moving-bodies';
import { scenePalette } from '@/shared/three/scene-palette';

const FIELD_OF_VIEW_DEGREES = 42;
// Leaves a margin so the full trajectory fits inside the initial front view.
const VIEWPORT_FILL = 0.82;
const GRID_SIZE = 12;
const GRID_DIVISIONS = 30;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

type Point = [number, number, number];

function fitTrajectory(trajectory: Trajectory, aspect: number) {
  const positions = trajectory.samples.flatMap((sample) =>
    BODY_INDICES.map((body) => bodyPosition(sample.state, body)),
  );
  const extentX = Math.max(...positions.map(([x]) => Math.abs(x)));
  const extentY = Math.max(...positions.map(([, y]) => Math.abs(y)));
  const cameraDistance = INITIAL_CAMERA_POSITION[2];
  const halfHeight =
    cameraDistance * Math.tan((FIELD_OF_VIEW_DEGREES / 2) * (Math.PI / 180)) * VIEWPORT_FILL;
  const scale = Math.min((halfHeight * aspect) / extentX, halfHeight / extentY);
  const paths = BODY_INDICES.map((body) =>
    trajectory.samples.map((sample): Point => {
      const [x, y] = bodyPosition(sample.state, body);
      return [x * scale, y * scale, 0];
    }),
  );
  return { scale, paths };
}

const SceneContents = memo(function SceneContents({
  trajectory,
  controller,
  onLost,
  dark,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  onLost: () => void;
  dark: boolean;
}) {
  const palette = scenePalette(dark);
  const { size } = useThree();
  const aspect = size.width / size.height;
  const { scale, paths } = useMemo(() => fitTrajectory(trajectory, aspect), [trajectory, aspect]);
  const traces = usePlaybackState(controller, (session) => session.traces);
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[-3, 4, 8]} intensity={2} />
      <gridHelper
        args={[GRID_SIZE, GRID_DIVISIONS, palette.gridCenter, palette.grid]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.25]}
      />
      {traces
        ? paths.map((points, i) => (
            <Line
              key={i}
              points={points}
              color={palette.bodies[i]}
              lineWidth={1}
              transparent
              opacity={palette.pathOpacity}
            />
          ))
        : null}
      <MovingBodies
        trajectory={trajectory}
        controller={controller}
        scale={scale}
        colors={palette.bodies}
      />
      <CameraRig controller={controller} onLost={onLost} />
    </>
  );
});

export default function OrbitScene({
  trajectory,
  controller,
  onLost,
  visible,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  onLost: () => void;
  visible: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const playing = usePlaybackState(controller, (session) => session.playing);
  return (
    <Canvas
      camera={{
        position: INITIAL_CAMERA_POSITION,
        fov: FIELD_OF_VIEW_DEGREES,
        near: 0.1,
        far: 100,
      }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      frameloop={playing && visible ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true }}
    >
      <SceneContents
        trajectory={trajectory}
        controller={controller}
        onLost={onLost}
        dark={resolvedTheme === 'dark'}
      />
    </Canvas>
  );
}
