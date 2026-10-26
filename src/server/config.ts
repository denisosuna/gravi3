import 'server-only';
import { z } from 'zod';

const integer = (fallback: number, maximum: number) =>
  z.coerce.number().int().min(1).max(maximum).default(fallback);
const boolean = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');
const schema = z.object({
  apiKey: z.string().trim().min(1).optional(),
  enabled: boolean('true'),
  model: z.string().min(1).max(100).default('openai/gpt-oss-20b'),
  timeout: integer(15000, 60000),
  maxTokens: integer(2048, 4096),
  perMinute: integer(5, 100),
  perHour: integer(30, 1000),
  globalPerHour: integer(100, 10000),
  concurrent: integer(3, 10),
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  appUrl: z
    .url()
    .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol))
    .default('http://localhost:3000'),
  trustProxy: boolean('false'),
});

export function getConfig(env: Readonly<Record<string, string | undefined>> = process.env) {
  const result = schema.safeParse({
    apiKey: env.GROQ_API_KEY?.trim() || undefined,
    enabled: env.LLM_ENABLED,
    model: env.LLM_MODEL,
    timeout: env.LLM_TIMEOUT_MS,
    maxTokens: env.LLM_MAX_COMPLETION_TOKENS,
    perMinute: env.RATE_LIMIT_IP_PER_MINUTE,
    perHour: env.RATE_LIMIT_IP_PER_HOUR,
    globalPerHour: env.RATE_LIMIT_GLOBAL_PER_HOUR,
    concurrent: env.LLM_MAX_CONCURRENT,
    logLevel: env.LOG_LEVEL,
    appUrl: env.APP_URL || env.RENDER_EXTERNAL_URL,
    trustProxy: env.TRUST_PROXY,
  });
  if (!result.success)
    throw new Error('Invalid server configuration. Check the documented environment variables.');
  return result.data;
}

export type ServerConfig = ReturnType<typeof getConfig>;
