import { describe, expect, it } from 'vitest';
import { MAX_TUTOR_ACTIONS, parseTutorOutput } from './tutor-actions';

const json = (value: unknown) => JSON.stringify(value);

describe('tutor output parsing', () => {
  it('keeps the reply and the valid actions allowed in the learning context', () => {
    const output = parseTutorOutput(
      json({
        reply: 'Try doubling the distance.',
        actions: [
          { type: 'setExperiment', distance: 10 },
          { type: 'loadPreset', preset: 'pythagorean' },
        ],
      }),
      'learning',
    );
    expect(output).toEqual({
      reply: 'Try doubling the distance.',
      actions: [
        { type: 'setExperiment', distance: 10 },
        { type: 'loadPreset', preset: 'pythagorean' },
      ],
    });
  });

  it('accepts "what if" changes to one simulator body within limits', () => {
    const actions = [
      { type: 'scaleBodyVelocity', body: 2, factor: 1.2 },
      { type: 'setBodyMass', body: 3, mass: 2 },
    ];
    expect(parseTutorOutput(json({ reply: 'Try it.', actions }), 'learning').actions).toEqual(
      actions,
    );
    const invalid = [
      { type: 'scaleBodyVelocity', body: 4, factor: 1.2 },
      { type: 'scaleBodyVelocity', body: 1, factor: 10 },
      { type: 'setBodyMass', body: 0, mass: 1 },
    ];
    expect(parseTutorOutput(json({ reply: 'Hi', actions: invalid }), 'learning').actions).toEqual(
      [],
    );
    expect(parseTutorOutput(json({ reply: 'Hi', actions }), 'orbit').actions).toEqual([]);
  });

  it('drops actions that are invalid, out of range or not allowed in the context', () => {
    const actions = [
      { type: 'setExperiment', distance: 500 },
      { type: 'setExperiment' },
      { type: 'deleteEverything' },
      { type: 'openOrbit', slug: 'goggles' },
      { type: 'perturb', extra: true },
    ];
    expect(parseTutorOutput(json({ reply: 'Hi', actions }), 'learning').actions).toEqual([]);
    expect(parseTutorOutput(json({ reply: 'Hi', actions }), 'orbit').actions).toEqual([
      { type: 'openOrbit', slug: 'goggles' },
    ]);
  });

  it('accepts player actions only on orbit pages and only within their ranges', () => {
    const actions = [
      { type: 'seekOrbit', fraction: 0.2 },
      { type: 'seekOrbit', fraction: 1.5 },
      { type: 'setOrbitSpeed', speed: 3 },
      { type: 'setOrbitSpeed', speed: 0.5 },
    ];
    expect(parseTutorOutput(json({ reply: 'Hi', actions }), 'orbit').actions).toEqual([
      { type: 'seekOrbit', fraction: 0.2 },
      { type: 'setOrbitSpeed', speed: 0.5 },
    ]);
    expect(parseTutorOutput(json({ reply: 'Hi', actions }), 'learning').actions).toEqual([]);
  });

  it('limits and de-duplicates suggested actions', () => {
    const actions = [
      { type: 'perturb' },
      { type: 'perturb' },
      ...['lagrange', 'figure-eight', 'pythagorean'].map((preset) => ({
        type: 'loadPreset',
        preset,
      })),
    ];
    const parsed = parseTutorOutput(json({ reply: 'Hi', actions }), 'learning').actions;
    expect(parsed).toHaveLength(MAX_TUTOR_ACTIONS);
    expect(parsed[0]).toEqual({ type: 'perturb' });
    expect(parsed[1]).toEqual({ type: 'loadPreset', preset: 'lagrange' });
  });

  it('falls back to plain text when the model does not return the JSON shape', () => {
    expect(parseTutorOutput('Gravity weakens with distance.', 'learning')).toEqual({
      reply: 'Gravity weakens with distance.',
      actions: [],
    });
    // JSON without a reply is unusable; the caller treats an empty reply as a failed response.
    expect(parseTutorOutput(json({ answer: 'wrong key' }), 'learning')).toEqual({
      reply: '',
      actions: [],
    });
    expect(parseTutorOutput(`Sure! ${json({ reply: 'Embedded', actions: [] })}`, 'orbit')).toEqual({
      reply: 'Embedded',
      actions: [],
    });
  });
});
