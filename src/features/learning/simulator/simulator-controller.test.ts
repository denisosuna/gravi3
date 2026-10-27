import { describe, expect, it } from 'vitest';
import { PERTURBATION, simulatorPreset } from '@/data/simulator-presets';
import { VELOCITY_OFFSET } from '@/physics/types';
import { SimulatorController } from './simulator-controller';

describe('simulator controller', () => {
  it('starts paused on the figure eight and loads presets from scratch', () => {
    const controller = new SimulatorController();
    expect(controller.snapshot()).toMatchObject({ presetId: 'figure-eight', playing: false });
    controller.update({ playing: true });
    controller.step(0.5);
    controller.loadPreset('pythagorean');
    expect(controller.snapshot()).toMatchObject({
      presetId: 'pythagorean',
      playing: false,
      time: 0,
    });
    expect(controller.simulation.masses).toEqual(simulatorPreset('pythagorean').masses);
  });

  it('marks edited setups as custom and restarts the simulation', () => {
    const controller = new SimulatorController();
    const revision = controller.snapshot().revision;
    controller.editBody(1, { mass: 2, vx: 0.5 });
    const { presetId, setup, revision: next } = controller.snapshot();
    expect(presetId).toBe('custom');
    expect(setup.masses[1]).toBe(2);
    expect(setup.initialState[VELOCITY_OFFSET + 2]).toBe(0.5);
    expect(next).toBeGreaterThan(revision);
  });

  it('perturbs the first body velocity slightly to reveal sensitivity', () => {
    const controller = new SimulatorController();
    const before = controller.snapshot().setup.initialState[VELOCITY_OFFSET]!;
    controller.perturb();
    expect(controller.snapshot().setup.initialState[VELOCITY_OFFSET]).toBeCloseTo(
      before * (1 + PERTURBATION),
    );
    expect(controller.snapshot().presetId).toBe('custom');
  });

  it('only advances while playing and pauses on an unresolved close encounter', () => {
    const controller = new SimulatorController();
    controller.step(1);
    expect(controller.simulation.time).toBe(0);
    controller.editBody(0, { vx: 0, vy: 0 });
    controller.editBody(1, { vx: 0, vy: 0 });
    controller.editBody(2, { vx: 0, vy: 0 });
    controller.update({ playing: true, speed: 2 });
    for (let frame = 0; frame < 600 && controller.snapshot().playing; frame++)
      controller.step(1 / 60);
    expect(controller.snapshot()).toMatchObject({ playing: false, event: 'closeEncounter' });
  });
});
