import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import type { Logger } from 'pino';
import { tutorRequestSchema, type TutorRequest } from '@/data/tutor-contract';
import type { ServerConfig } from './config';
import type { RateLimiter } from './rate-limiter';
import { classifyTutorError } from './tutor-errors';
import { readJsonBody, RequestError } from './request-body';

interface Dependencies {
  config: ServerConfig;
  limiter: RateLimiter;
  logger: Logger;
  complete: (input: TutorRequest, signal: AbortSignal) => Promise<string>;
}

function acceptsOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return (
      origin === new URL(appUrl).origin ||
      origin === new URL(request.url).origin ||
      parsed.host === request.headers.get('host')
    );
  } catch {
    return false;
  }
}

export async function handleTutor(request: Request, dependencies: Dependencies): Promise<Response> {
  const { config, limiter, complete, logger } = dependencies;
  const requestId = randomUUID();
  const started = Date.now();
  let release: (() => void) | undefined;
  let providerSignal: AbortSignal | undefined;
  const respond = (status: number, body: object, retryAfter?: number) =>
    Response.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Request-Id': requestId,
        ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
      },
    });
  try {
    if (!config.enabled || !config.apiKey) return respond(503, { error: 'tutor_disabled' });
    if (!acceptsOrigin(request, config.appUrl)) throw new RequestError(403, 'invalid_origin');
    const input = tutorRequestSchema.safeParse(await readJsonBody(request));
    if (!input.success) throw new RequestError(400, 'invalid_request');
    const address = config.trustProxy
      ? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
      : undefined;
    const key =
      address && isIP(address) ? createHash('sha256').update(address).digest('hex') : 'shared';
    release = limiter.acquire(key);
    const signal = (providerSignal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(config.timeout),
    ]));
    signal.throwIfAborted();
    const reply = await complete(input.data, signal);
    if (!reply.trim()) throw new Error('Empty tutor response.');
    logger.info({
      event: 'tutor.completed',
      requestId,
      durationMs: Date.now() - started,
      status: 200,
      model: config.model,
    });
    return respond(200, { reply });
  } catch (error) {
    const { status, code, retryAfter, upstreamStatus } = classifyTutorError(
      error,
      request.signal.aborted,
      Boolean(providerSignal?.aborted),
    );
    logger[status >= 500 ? 'error' : 'warn']({
      event: 'tutor.failed',
      upstreamStatus,
      requestId,
      status,
      code,
      durationMs: Date.now() - started,
      model: config.model,
    });
    return respond(status, { error: code }, retryAfter);
  } finally {
    release?.();
  }
}
