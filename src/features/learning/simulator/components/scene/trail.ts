import { BufferAttribute, BufferGeometry, Line as ThreeLine, LineBasicMaterial } from 'three';

const TRAIL_POINTS = 900;

export function createTrail(color: string, opacity: number) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(TRAIL_POINTS * 3), 3));
  geometry.setDrawRange(0, 0);
  const material = new LineBasicMaterial({ color, transparent: true, opacity });
  const trail = new ThreeLine(geometry, material);
  // The trail moves every frame; skipping culling avoids recomputing its bounds each time.
  trail.frustumCulled = false;
  return trail;
}

// Trails are a sliding window of recent positions; older points shift out of the buffer.
export function pushTrailPoint(
  trail: ThreeLine<BufferGeometry, LineBasicMaterial>,
  x: number,
  y: number,
) {
  const attribute = trail.geometry.attributes.position as BufferAttribute;
  const array = attribute.array as Float32Array;
  const count = trail.geometry.drawRange.count;
  if (count === TRAIL_POINTS) array.copyWithin(0, 3);
  const index = Math.min(count, TRAIL_POINTS - 1);
  array.set([x, y, 0], index * 3);
  trail.geometry.setDrawRange(0, Math.min(count + 1, TRAIL_POINTS));
  attribute.needsUpdate = true;
}
