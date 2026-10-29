import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Group } from 'three';
import { LiquidBody, LiquidEnvironment } from '@/shared/three/liquid-body';
import { useReducedMotion } from '@/shared/three/use-reduced-motion';
import type { SceneMotion } from '../model/scene-motions';

const CAMERA_DISTANCE = 6;
const FIELD_OF_VIEW_DEGREES = 40;
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const GUIDE_COLOR = '#9fb0cc';

function MotionBodies({ motion }: { motion: SceneMotion }) {
  const reduced = useReducedMotion();
  // Reduced motion shows the last frame, which is still the question, never the answer.
  const first = useMemo(() => motion.poseAt(reduced ? motion.duration : 0), [motion, reduced]);
  const groups = useRef<(Group | null)[]>([]);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (reduced || time.current >= motion.duration) return;
    time.current = Math.min(motion.duration, time.current + delta);
    motion.poseAt(time.current).forEach((pose, index) => {
      groups.current[index]?.position.set(pose.x, pose.y, 0);
    });
  });
  return (
    <>
      {first.map((pose, index) => (
        <group
          key={index}
          position={[pose.x, pose.y, 0]}
          ref={(group) => {
            groups.current[index] = group;
          }}
        >
          <LiquidBody index={pose.body} radius={pose.radius} />
        </group>
      ))}
    </>
  );
}

// Plays a calibration scene once; a new `playKey` replays it from the start.
export default function CalibrationScene({
  motion,
  playKey,
}: {
  motion: SceneMotion;
  playKey: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: FIELD_OF_VIEW_DEGREES }}
      dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[-3, 4, 6]} intensity={1.6} />
      <LiquidEnvironment />
      {motion.guides.map(([from, to], index) => (
        <Line
          key={index}
          points={[
            [from[0], from[1], 0],
            [to[0], to[1], 0],
          ]}
          color={GUIDE_COLOR}
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
      <MotionBodies key={playKey} motion={motion} />
    </Canvas>
  );
}
