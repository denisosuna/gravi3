import { z } from 'zod';
import { LOCALES } from '@/i18n/config';
import { orbitSlugs } from '@/physics/types';
import { distanceRange, massRange, PREDICTIONS } from './experiment';
import { SIMULATOR_PRESETS } from './simulator-presets';

export const TUTOR_LIMITS = {
  messageLength: 1000,
  historyMessages: 6,
  displayedMessages: 8,
  replyLength: 6000,
} as const;

export const TUTOR_ERROR_CODES = {
  disabled: 'tutor_disabled',
  invalidOrigin: 'invalid_origin',
  invalidRequest: 'invalid_request',
  rateLimited: 'rate_limited',
  cancelled: 'cancelled',
  timeout: 'timeout',
  providerUnavailable: 'provider_unavailable',
} as const;

const learningContext = z
  .object({
    kind: z.literal('learning'),
    mass1: z.number().min(massRange.min).max(massRange.max),
    mass2: z.number().min(massRange.min).max(massRange.max),
    distance: z.number().min(distanceRange.min).max(distanceRange.max),
    prediction: z.enum(PREDICTIONS).nullable(),
    simulator: z
      .object({
        preset: z.enum([...SIMULATOR_PRESETS, 'custom']),
        event: z.enum(['collision', 'escape']).nullable(),
      })
      .strict()
      .optional(),
  })
  .strict();
const orbitContext = z
  .object({
    kind: z.literal('orbit'),
    slug: z.enum(orbitSlugs),
  })
  .strict();
const messageText = z.string().min(1).max(TUTOR_LIMITS.messageLength);

export const tutorRequestSchema = z
  .object({
    locale: z.enum(LOCALES),
    message: z.string().trim().min(1).max(TUTOR_LIMITS.messageLength),
    history: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: messageText }).strict())
      .max(TUTOR_LIMITS.historyMessages),
    context: z.discriminatedUnion('kind', [learningContext, orbitContext]),
  })
  .strict();

export type TutorRequest = z.infer<typeof tutorRequestSchema>;
export type TutorContext = TutorRequest['context'];
export type TutorMessage = TutorRequest['history'][number];
