'use client';

import { memo, type ComponentRef, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Line as ThreeLine,
  LineBasicMaterial,
} from 'three';
import { useTheme } from 'next-themes';
import type { Trajectory } from '@/physics/types';
import { samplePositions } from '@/physics/interpolation';
import type { PlaybackController } from '@/features/orbits/playback';

const COLORS = ['#55b7ff', '#ffbc62', '#b875ff'];

function MovingBodies({
  trajectory,
  controller,
  scale,
}: {
  trajectory: Trajectory;
  controller: PlaybackController;
  scale: number;
}) {
  const groups = useRef<(Group | null)[]>([]);
  const target = useMemo(() => Array<number>(6).fill(0), []);
  const trails = useMemo(
    () =>
      COLORS.map((color) => {
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(129 * 3), 3));
        return new ThreeLine(
          geometry,
          new LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
        );
      }),
    [],
  );
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
    samplePositions(trajectory, controller.time, target);
    for (let body = 0; body < 3; body++)
      groups.current[body]?.position.set(
        target[2 * body]! * scale,
        target[2 * body + 1]! * scale,
        0,
      );
    for (let i = 0; i <= 128; i++) {
      const time =
        (controller.time - ((1 - i / 128) * trajectory.period) / 3 + trajectory.period) %
        trajectory.period;
      samplePositions(trajectory, time, target);
      for (let body = 0; body < 3; body++)
        trails[body]!.geometry.attributes.position!.setXYZ(
          i,
          target[2 * body]! * scale,
          target[2 * body + 1]! * scale,
          0.002,
        );
    }
    trails.forEach((trail) => {
      trail.visible = controller.snapshot().traces;
      trail.geometry.attributes.position!.needsUpdate = true;
      trail.geometry.computeBoundingSphere();
    });
  });
  return (
    <>
      {trails.map((trail, i) => (
        <primitive object={trail} key={`trail-${i}`} />
      ))}
      {COLORS.map((color, body) => (
        <group
          key={color}
          ref={(group) => {
            groups.current[body] = group;
          }}
        >
          <Html position={[0.12, 0.12, 0]} center>
            <span className="body-label">{body + 1}</span>
          </Html>
          <mesh>
            <sphereGeometry args={[0.065, 24, 20]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.7}
              roughness={0.25}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.105, 16, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.11}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.145, 16, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.035}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function CameraRig({ controller, onLost }: { controller: PlaybackController; onLost: () => void }) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  const revision = controller.cameraRevision;
  useEffect(() => {
    const saved = controller.export().camera;
    camera.position.set(
      ...(saved ?? (state.view === 'front' ? ([0, 0, 6] as const) : ([0.5, -4, 5.8] as const))),
    );
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, controller, state.view, revision, invalidate]);
  useEffect(() => {
    function lost(event: Event) {
      event.preventDefault();
      onLost();
    }
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLost]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={false}
      enableRotate={state.view === '3d'}
      minDistance={3}
      maxDistance={10}
      onChange={() => controller.saveCamera(camera.position.toArray() as [number, number, number])}
    />
  );
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
  const { size } = useThree();
  const aspect = size.width / size.height;
  const { scale, paths } = useMemo(() => {
    const extentX = Math.max(
      ...trajectory.samples.flatMap((sample) => [
        Math.abs(sample.state[0]!),
        Math.abs(sample.state[2]!),
        Math.abs(sample.state[4]!),
      ]),
    );
    const extentY = Math.max(
      ...trajectory.samples.flatMap((sample) => [
        Math.abs(sample.state[1]!),
        Math.abs(sample.state[3]!),
        Math.abs(sample.state[5]!),
      ]),
    );
    const halfHeight = 6 * Math.tan((21 * Math.PI) / 180) * 0.82;
    const scale = Math.min((halfHeight * aspect) / extentX, halfHeight / extentY);
    const paths = COLORS.map((_, body) =>
      trajectory.samples.map(
        (sample) =>
          [sample.state[2 * body]! * scale, sample.state[2 * body + 1]! * scale, 0] as [
            number,
            number,
            number,
          ],
      ),
    );
    return { scale, paths };
  }, [trajectory, aspect]);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[-3, 4, 8]} intensity={2} />
      <gridHelper
        args={[12, 30, dark ? '#263e5a' : '#bbd0ed', dark ? '#16283e' : '#dae5f5']}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.25]}
      />
      {state.traces
        ? paths.map((points, i) => (
            <Line
              key={i}
              points={points}
              color={COLORS[i]}
              lineWidth={1}
              transparent
              opacity={0.18}
            />
          ))
        : null}
      <MovingBodies trajectory={trajectory} controller={controller} scale={scale} />
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
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.snapshot,
    controller.snapshot,
  );
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      frameloop={state.playing && visible ? 'always' : 'demand'}
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
