import { describe, expect, it } from 'vitest';
import { divergence } from './divergence';

const at = (positions: number[]) => [...positions, 0, 0, 0, 0, 0, 0];

describe('divergence between two runs', () => {
  it('is zero for identical states and the largest body separation otherwise', () => {
    const state = at([0, 0, 1, 0, -1, 0]);
    expect(divergence(state, state)).toBe(0);
    expect(divergence(state, at([0, 0, 1, 3, -1, 0]))).toBe(3);
  });
});
