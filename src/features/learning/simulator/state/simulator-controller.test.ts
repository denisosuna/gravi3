import { describe, expect, it } from 'vitest';
import { PERTURBATION, simulatorPreset } from '@/features/learning/model/simulator-presets';
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

  it('can start from any gallery orbit', () => {
    const controller = new SimulatorController('butterfly-i');
    expect(controller.snapshot()).toMatchObject({ presetId: 'butterfly-i', playing: false });
    expect(controller.simulation.masses).toEqual(simulatorPreset('butterfly-i').masses);
    controller.perturb();
    expect(controller.reference?.masses).toEqual(simulatorPreset('butterfly-i').masses);
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

  it('perturbs the start slightly to reveal sensitivity', () => {
    const controller = new SimulatorController();
    const before = controller.snapshot().setup.initialState[VELOCITY_OFFSET]!;
    controller.perturb();
    expect(controller.snapshot().setup.initialState[VELOCITY_OFFSET]).toBeCloseTo(
      before * (1 + PERTURBATION),
    );
    expect(controller.snapshot().presetId).toBe('custom');
  });

  it('scales one body velocity without changing its direction', () => {
    const controller = new SimulatorController();
    const before = controller.snapshot().setup.initialState;
    controller.scaleBodyVelocity(1, 1.5);
    const after = controller.snapshot().setup.initialState;
    expect(after[VELOCITY_OFFSET + 2]).toBeCloseTo(before[VELOCITY_OFFSET + 2]! * 1.5);
    expect(after[VELOCITY_OFFSET + 3]).toBeCloseTo(before[VELOCITY_OFFSET + 3]! * 1.5);
    expect(after[VELOCITY_OFFSET]).toBe(before[VELOCITY_OFFSET]);
    expect(controller.snapshot().presetId).toBe('custom');
  });

  it('runs the original preset beside an edited setup until another preset loads', () => {
    const controller = new SimulatorController();
    expect(controller.reference).toBeNull();
    controller.scaleBodyVelocity(1, 1.2);
    expect(controller.snapshot().divergence).toBe(0);
    controller.editBody(0, { mass: 1.5 });
    expect(controller.reference?.masses).toEqual(simulatorPreset('figure-eight').masses);
    controller.update({ playing: true });
    for (let frame = 0; frame < 120; frame++) controller.step(1 / 60);
    controller.publish();
    expect(controller.snapshot().divergence).toBeGreaterThan(0);
    controller.loadPreset('lagrange');
    expect(controller.reference).toBeNull();
    expect(controller.snapshot().divergence).toBeNull();
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
