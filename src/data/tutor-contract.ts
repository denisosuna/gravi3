import { z } from 'zod';
import { distanceRange, massRange } from './experiment';
import { orbitSlugs } from '@/physics/types';

const learningContext = z
  .object({
    kind: z.literal('learning'),
    mass1: z.number().min(massRange.min).max(massRange.max),
    mass2: z.number().min(massRange.min).max(massRange.max),
    distance: z.number().min(distanceRange.min).max(distanceRange.max),
    prediction: z.enum(['half', 'quarter', 'double']).nullable(),
  })
  .strict();
const orbitContext = z
  .object({
    kind: z.literal('orbit'),
    slug: z.enum(orbitSlugs),
  })
  .strict();

export const tutorRequestSchema = z
  .object({
    locale: z.enum(['es', 'en']),
    message: z.string().trim().min(1).max(1000),
    history: z
      .array(
        z
          .object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(1000) })
          .strict(),
      )
      .max(6),
    context: z.discriminatedUnion('kind', [learningContext, orbitContext]),
  })
  .strict();

export type TutorRequest = z.infer<typeof tutorRequestSchema>;
export type TutorContext = TutorRequest['context'];
export type TutorMessage = TutorRequest['history'][number];
