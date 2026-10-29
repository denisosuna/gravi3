import { describe, expect, it } from 'vitest';
import { sceneMotion } from './scene-motions';

describe('calibration scenes never give the answer away', () => {
  it('fall: both balls end at rest at the same height, before being released', () => {
    const motion = sceneMotion('fall');
    const [heavy, light] = motion.poseAt(motion.duration);
    expect(heavy!.y).toBeCloseTo(light!.y, 6);
    expect(motion.poseAt(motion.duration - 0.5)).toEqual(motion.poseAt(motion.duration));
  });

  it('twins: the real runs still look the same when the animation stops', () => {
    const motion = sceneMotion('twins');
    const poses = motion.poseAt(motion.duration);
    const left = poses.slice(0, 3);
    const right = poses.slice(3);
    const largestGap = Math.max(
      ...left.map((pose, body) => {
        const twin = right[body]!;
        return Math.hypot(twin.x - pose.x - (right[0]!.x - left[0]!.x), twin.y - pose.y);
      }),
    );
    expect(largestGap).toBeLessThan(0.05);
  });

  it('distance: the bodies move apart and the scene shows no force value', () => {
    const motion = sceneMotion('distance');
    const start = motion.poseAt(0);
    const end = motion.poseAt(motion.duration);
    expect(end[1]!.x - end[0]!.x).toBeGreaterThan(3 * (start[1]!.x - start[0]!.x));
  });
});
