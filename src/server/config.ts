import 'server-only';
import { z } from 'zod';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export const REASONING_EFFORTS = ['low', 'medium', 'high'] as const;

const DEFAULT_APP_URL = 'http://localhost:3000';

const integer = (fallback: number, maximum: number) =>
  z.coerce.number().int().min(1).max(maximum).default(fallback);
const boolean = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(fallback)
    .transform((value) => value === 'true');
const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol));
const optionalText = z.string().trim().min(1).optional();

const schema = z
  .object({
    llm: z.object({
      enabled: boolean('true'),
      apiKey: optionalText,
      baseUrl: httpUrl.optional(),
      model: optionalText,
      reasoningEffort: z.enum(REASONING_EFFORTS).optional(),
      timeoutMs: integer(15000, 60000),
      maxCompletionTokens: integer(2048, 8192),
    }),
    rateLimit: z.object({
      perMinute: integer(5, 100),
      perHour: integer(30, 1000),
      globalPerHour: integer(100, 10000),
      concurrent: integer(3, 10),
    }),
    logLevel: z.enum(LOG_LEVELS).default('info'),
    appUrl: httpUrl.default(DEFAULT_APP_URL),
    trustProxy: boolean('false'),
  })
  .refine(({ llm }) => !llm.apiKey || (llm.baseUrl && llm.model), {
    message: 'LLM_BASE_URL and LLM_MODEL are required when LLM_API_KEY is set.',
  })
  .transform(({ llm, ...config }) => {
    const { apiKey, baseUrl, model, ...options } = llm;
    const provider = apiKey && baseUrl && model ? { apiKey, baseUrl, model } : undefined;
    return {
      ...config,
      llm: { ...options, provider },
      tutorEnabled: options.enabled && Boolean(provider),
    };
  });

type Environment = Readonly<Record<string, string | undefined>>;

export function getConfig(env: Environment = process.env) {
  const read = (name: string) => env[name]?.trim() || undefined;
  const result = schema.safeParse({
    llm: {
      enabled: read('LLM_ENABLED'),
      apiKey: read('LLM_API_KEY'),
      baseUrl: read('LLM_BASE_URL'),
      model: read('LLM_MODEL'),
      reasoningEffort: read('LLM_REASONING_EFFORT'),
      timeoutMs: read('LLM_TIMEOUT_MS'),
      maxCompletionTokens: read('LLM_MAX_COMPLETION_TOKENS'),
    },
    rateLimit: {
      perMinute: read('RATE_LIMIT_IP_PER_MINUTE'),
      perHour: read('RATE_LIMIT_IP_PER_HOUR'),
      globalPerHour: read('RATE_LIMIT_GLOBAL_PER_HOUR'),
      concurrent: read('LLM_MAX_CONCURRENT'),
    },
    logLevel: read('LOG_LEVEL'),
    appUrl: read('APP_URL') ?? read('RENDER_EXTERNAL_URL'),
    trustProxy: read('TRUST_PROXY'),
  });
  if (!result.success)
    throw new Error('Invalid server configuration. Check the documented environment variables.');
  return result.data;
}

export type ServerConfig = ReturnType<typeof getConfig>;
export type LlmConfig = ServerConfig['llm'];
export type LlmProvider = NonNullable<LlmConfig['provider']>;
