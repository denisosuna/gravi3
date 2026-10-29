import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import {
  ZOOM_LEVELS,
  type SimulatorController,
} from '@/features/learning/simulator/state/simulator-controller';
import { useSimulatorState } from '@/features/learning/simulator/state/use-simulator-state';
import { scenePalette } from '@/shared/three/scene-palette';
import { ReferenceBodies } from './reference-bodies';
import { SimulatorBodies } from './simulator-bodies';
import { LiquidEnvironment } from '@/shared/three/liquid-body';

const BASE_CAMERA_DISTANCE = 9;
const FIELD_OF_VIEW_DEGREES = 40;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const GRID_SIZE = 24;
const GRID_DIVISIONS = 24;

// Zoom moves a top-down camera closer; the system is simulated in its center-of-mass frame.
function ZoomCamera({ zoom }: { zoom: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, BASE_CAMERA_DISTANCE / zoom);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [camera, zoom, invalidate]);
  return null;
}

export default function SimulatorScene({
  controller,
  showVectors,
  visible,
}: {
  controller: SimulatorController;
  showVectors: boolean;
  visible: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const palette = scenePalette(resolvedTheme === 'dark');
  const playing = useSimulatorState(controller, (state) => state.playing);
  const revision = useSimulatorState(controller, (state) => state.revision);
  const zoomIndex = useSimulatorState(controller, (state) => state.zoomIndex);
  return (
    <Canvas
      camera={{ position: [0, 0, BASE_CAMERA_DISTANCE], fov: FIELD_OF_VIEW_DEGREES }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      frameloop={playing && visible ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 4, 8]} intensity={1.6} />
      <LiquidEnvironment />
      <gridHelper
        args={[GRID_SIZE, GRID_DIVISIONS, palette.gridCenter, palette.grid]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.2]}
      />
      <ZoomCamera zoom={ZOOM_LEVELS[zoomIndex] ?? 1} />
      <SimulatorBodies
        key={revision}
        controller={controller}
        colors={palette.bodies}
        showVectors={showVectors}
      />
      <ReferenceBodies
        key={`reference-${revision}`}
        controller={controller}
        colors={palette.bodies}
      />
    </Canvas>
  );
}
