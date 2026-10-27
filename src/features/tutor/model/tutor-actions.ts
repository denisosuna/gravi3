import { z } from 'zod';
import { orbitSlugs } from '@/physics/types';
import { distanceRange, massRange } from '@/features/learning/model/experiment';
import { PLAYBACK_SPEEDS } from '@/features/orbits/model/playback';
import { SIMULATOR_PRESETS } from '@/features/learning/model/simulator-presets';

export const MAX_TUTOR_ACTIONS = 2;

const mass = z.number().min(massRange.min).max(massRange.max);

const setExperiment = z
  .object({
    type: z.literal('setExperiment'),
    mass1: mass.optional(),
    mass2: mass.optional(),
    distance: z.number().min(distanceRange.min).max(distanceRange.max).optional(),
  })
  .strict()
  .refine(({ mass1, mass2, distance }) => [mass1, mass2, distance].some((v) => v !== undefined));

export const tutorActionSchema = z.discriminatedUnion('type', [
  setExperiment,
  z.object({ type: z.literal('loadPreset'), preset: z.enum(SIMULATOR_PRESETS) }).strict(),
  z.object({ type: z.literal('perturb') }).strict(),
  z.object({ type: z.literal('openOrbit'), slug: z.enum(orbitSlugs) }).strict(),
  // A moment of the current orbit as a fraction of its period, so the period never has to be trusted.
  z.object({ type: z.literal('seekOrbit'), fraction: z.number().min(0).max(1) }).strict(),
  z.object({ type: z.literal('setOrbitSpeed'), speed: z.literal(PLAYBACK_SPEEDS) }).strict(),
]);

export type TutorAction = z.infer<typeof tutorActionSchema>;
export type TutorActionType = TutorAction['type'];

// What the tutor may propose on each page; anything else is discarded on the server.
export const ACTIONS_BY_CONTEXT = {
  learning: ['setExperiment', 'loadPreset', 'perturb'],
  orbit: ['openOrbit', 'seekOrbit', 'setOrbitSpeed'],
} as const satisfies Record<string, readonly TutorActionType[]>;
export type TutorContextKind = keyof typeof ACTIONS_BY_CONTEXT;

export const tutorResponseSchema = z.object({
  reply: z.string().min(1),
  actions: z.array(tutorActionSchema).max(MAX_TUTOR_ACTIONS).default([]),
});
export type TutorResponse = z.infer<typeof tutorResponseSchema>;

const JSON_OBJECT = /\{[\s\S]*\}/;

function parseJsonObject(content: string): unknown {
  for (const candidate of [content, content.match(JSON_OBJECT)?.[0]]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
}

function allowedActions(raw: unknown, kind: TutorContextKind): TutorAction[] {
  if (!Array.isArray(raw)) return [];
  const allowed: readonly TutorActionType[] = ACTIONS_BY_CONTEXT[kind];
  const unique = new Map<string, TutorAction>();
  for (const candidate of raw) {
    const action = tutorActionSchema.safeParse(candidate);
    if (action.success && allowed.includes(action.data.type))
      unique.set(JSON.stringify(action.data), action.data);
  }
  return [...unique.values()].slice(0, MAX_TUTOR_ACTIONS);
}

// Models are asked for {"reply", "actions"}; plain text is still accepted as a reply without actions.
export function parseTutorOutput(content: string, kind: TutorContextKind): TutorResponse {
  const parsed = parseJsonObject(content.trim());
  if (typeof parsed !== 'object' || parsed === null) return { reply: content.trim(), actions: [] };
  const { reply, actions } = parsed as { reply?: unknown; actions?: unknown };
  if (typeof reply !== 'string') return { reply: '', actions: [] };
  return { reply: reply.trim(), actions: allowedActions(actions, kind) };
}
