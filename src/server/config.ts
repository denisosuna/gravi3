import 'server-only';
import type { ReasoningEffort } from 'openai/resources/shared';
import { z } from 'zod';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export const REASONING_EFFORTS = [
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
] as const satisfies readonly NonNullable<ReasoningEffort>[];

const DEFAULT_APP_URL = 'http://localhost:3000';

// Single source of truth for environment variable names, used to read values and report errors.
const ENV_NAMES = {
  'llm.enabled': 'LLM_ENABLED',
  'llm.apiKey': 'LLM_API_KEY',
  'llm.baseUrl': 'LLM_BASE_URL',
  'llm.model': 'LLM_MODEL',
  'llm.reasoningEffort': 'LLM_REASONING_EFFORT',
  'llm.timeoutMs': 'LLM_TIMEOUT_MS',
  'llm.maxCompletionTokens': 'LLM_MAX_COMPLETION_TOKENS',
  'rateLimit.perMinute': 'RATE_LIMIT_IP_PER_MINUTE',
  'rateLimit.perHour': 'RATE_LIMIT_IP_PER_HOUR',
  'rateLimit.globalPerHour': 'RATE_LIMIT_GLOBAL_PER_HOUR',
  'rateLimit.concurrent': 'LLM_MAX_CONCURRENT',
  logLevel: 'LOG_LEVEL',
  appUrl: 'APP_URL',
  trustedProxyHops: 'TRUSTED_PROXY_HOPS',
} as const;
const FALLBACK_APP_URL_NAME = 'RENDER_EXTERNAL_URL';

const integer = (fallback: number, minimum: number, maximum: number) =>
  z.coerce.number().int().min(minimum).max(maximum).default(fallback);
const boolean = (fallback: 'true' | 'false') =>
  z
    .string()
    .default(fallback)
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(['true', 'false']))
    .transform((value) => value === 'true');
const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol));
const optionalText = z.string().min(1).optional();

const schema = z
  .object({
    llm: z.object({
      enabled: boolean('true'),
      apiKey: optionalText,
      baseUrl: httpUrl.optional(),
      model: optionalText,
      reasoningEffort: z.enum(REASONING_EFFORTS).optional(),
      timeoutMs: integer(15000, 1, 60000),
      maxCompletionTokens: integer(2048, 1, 8192),
    }),
    rateLimit: z.object({
      perMinute: integer(5, 1, 100),
      perHour: integer(30, 1, 1000),
      globalPerHour: integer(100, 1, 10000),
      concurrent: integer(3, 1, 10),
    }),
    logLevel: z.enum(LOG_LEVELS).default('info'),
    appUrl: httpUrl.default(DEFAULT_APP_URL),
    // Number of trusted proxies that append to X-Forwarded-For; 0 ignores the header.
    trustedProxyHops: integer(0, 0, 5),
  })
  .superRefine(({ llm }, context) => {
    if (!llm.apiKey) return;
    for (const field of ['baseUrl', 'model'] as const)
      if (!llm[field])
        context.addIssue({
          code: 'custom',
          path: ['llm', field],
          message: 'required when LLM_API_KEY is set',
        });
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
type ConfigPath = keyof typeof ENV_NAMES;

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const [head, tail] = path.split('.') as [string, string | undefined];
  if (!tail) {
    target[head] = value;
    return;
  }
  const nested = (target[head] ??= {}) as Record<string, unknown>;
  nested[tail] = value;
}

function readEnvironment(env: Environment): Record<string, unknown> {
  const read = (name: string) => env[name]?.trim() || undefined;
  const raw: Record<string, unknown> = {};
  for (const [path, name] of Object.entries(ENV_NAMES)) setPath(raw, path, read(name));
  raw.appUrl ??= read(FALLBACK_APP_URL_NAME);
  return raw;
}

// Names the offending variables without ever echoing their values, which may be secrets.
function describeIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.join('.') as ConfigPath;
      return `${ENV_NAMES[path] ?? path}: ${issue.message}`;
    })
    .join('; ');
}

function parseConfig(env: Environment) {
  const result = schema.safeParse(readEnvironment(env));
  if (!result.success)
    throw new Error(`Invalid server configuration. ${describeIssues(result.error.issues)}`);
  return result.data;
}

let processConfig: ReturnType<typeof parseConfig> | undefined;

// process.env is fixed for the life of the server, so it is parsed once.
export function getConfig(env: Environment = process.env) {
  if (env !== process.env) return parseConfig(env);
  processConfig ??= parseConfig(env);
  return processConfig;
}

export type ServerConfig = ReturnType<typeof getConfig>;
export type LlmConfig = ServerConfig['llm'];
export type LlmProvider = NonNullable<LlmConfig['provider']>;
