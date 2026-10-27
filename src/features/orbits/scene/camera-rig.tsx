import { type ComponentRef, useEffect, useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { CameraView, PlaybackController } from '../playback';
import { usePlaybackState } from '../use-playback-state';

type Vector3 = [number, number, number];

const DEFAULT_CAMERA_POSITIONS: Record<CameraView, Vector3> = {
  front: [0, 0, 6],
  '3d': [0.5, -4, 5.8],
};
const CAMERA_DISTANCE = { min: 3, max: 10 } as const;

export function CameraRig({
  controller,
  onLost,
}: {
  controller: PlaybackController;
  onLost: () => void;
}) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const view = usePlaybackState(controller, (session) => session.view);
  const revision = controller.cameraRevision;
  useEffect(() => {
    const saved = controller.export().camera;
    camera.position.set(...(saved ?? DEFAULT_CAMERA_POSITIONS[view]));
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, controller, view, revision, invalidate]);
  useLayoutEffect(() => {
    function lost(event: Event) {
      event.preventDefault();
      onLost();
    }
    gl.domElement.addEventListener('webglcontextlost', lost);
    gl.domElement.setAttribute('data-ready', 'true');
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost);
      gl.domElement.removeAttribute('data-ready');
    };
  }, [gl, onLost]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={false}
      enableRotate={view === '3d'}
      minDistance={CAMERA_DISTANCE.min}
      maxDistance={CAMERA_DISTANCE.max}
      onChange={() => controller.saveCamera(camera.position.toArray() as Vector3)}
    />
  );
}

export const INITIAL_CAMERA_POSITION = DEFAULT_CAMERA_POSITIONS.front;
