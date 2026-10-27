import { useLayoutEffect, useMemo, type Ref } from 'react';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3, type ArrowHelper } from 'three';

const MIN_CAMERA_DISTANCE = 3.2;
const RULER_TICK = 0.08;

const RIGHT = new Vector3(1, 0, 0);
const LEFT = new Vector3(-1, 0, 0);

export function ForceArrow({
  arrowRef,
  x,
  y,
  direction,
  length,
  color,
}: {
  arrowRef: Ref<ArrowHelper>;
  x: number;
  y: number;
  direction: Vector3;
  length: number;
  color: string;
}) {
  const origin = useMemo(() => new Vector3(x, y, 0), [x, y]);
  return (
    <arrowHelper
      ref={arrowRef}
      args={[direction, origin, length, color, length * 0.28, length * 0.16]}
    />
  );
}

export function CameraFit({
  visibleHalfWidth,
  fieldOfViewDegrees,
}: {
  visibleHalfWidth: number;
  fieldOfViewDegrees: number;
}) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    const halfFov = (fieldOfViewDegrees / 2) * (Math.PI / 180);
    const aspect = size.width / size.height;
    const distance = Math.max(MIN_CAMERA_DISTANCE, visibleHalfWidth / (Math.tan(halfFov) * aspect));
    camera.position.setLength(distance);
    invalidate();
  }, [camera, fieldOfViewDegrees, invalidate, size, visibleHalfWidth]);
  return null;
}

export function DistanceRuler({
  left,
  right,
  color,
  y,
}: {
  left: number;
  right: number;
  color: string;
  y: number;
}) {
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

export { LEFT, RIGHT };
