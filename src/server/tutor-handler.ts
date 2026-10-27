import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import type { Logger } from 'pino';
import { HTTP_STATUS, NO_STORE_HEADERS } from '@/shared/constants/http';
import {
  TUTOR_ERROR_CODES,
  TUTOR_LIMITS,
  tutorRequestSchema,
  type TutorRequest,
} from '@/features/tutor/model/tutor-contract';
import { parseTutorOutput } from '@/features/tutor/model/tutor-actions';
import type { ServerConfig } from './config';
import { LOG_EVENTS } from './log-events';
import type { RateLimiter } from './rate-limiter';
import { readJsonBody, RequestError } from './request-body';
import { classifyTutorError } from './tutor-errors';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

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
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;
    return (
      origin === new URL(appUrl).origin ||
      origin === new URL(request.url).origin ||
      parsed.host === request.headers.get('host')
    );
  } catch {
    return false;
  }
}

// Each trusted proxy appends one X-Forwarded-For entry, so the client is `hops` entries from the end.
// Earlier entries are client-controlled and ignored. The raw IP is hashed and never stored.
function clientKey(request: Request, trustedProxyHops: number): string | undefined {
  if (trustedProxyHops === 0) return undefined;
  const entries = request.headers.get('x-forwarded-for')?.split(',') ?? [];
  const address = entries.at(-trustedProxyHops)?.trim();
  return address && isIP(address) ? createHash('sha256').update(address).digest('hex') : undefined;
}

function jsonResponse(requestId: string, status: number, body: object, retryAfter?: number) {
  return Response.json(body, {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      'X-Request-Id': requestId,
      ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
    },
  });
}

export async function handleTutor(request: Request, dependencies: Dependencies): Promise<Response> {
  const { config, limiter, complete, logger } = dependencies;
  const requestId = randomUUID();
  const started = Date.now();
  const logContext = () => ({
    requestId,
    durationMs: Date.now() - started,
    model: config.llm.provider?.model,
  });
  let release: (() => void) | undefined;
  let providerSignal: AbortSignal | undefined;
  try {
    if (!config.tutorEnabled)
      return jsonResponse(requestId, HTTP_STATUS.serviceUnavailable, {
        error: TUTOR_ERROR_CODES.disabled,
      });
    if (!acceptsOrigin(request, config.appUrl))
      throw new RequestError(HTTP_STATUS.forbidden, TUTOR_ERROR_CODES.invalidOrigin);
    const input = tutorRequestSchema.safeParse(await readJsonBody(request));
    if (!input.success)
      throw new RequestError(HTTP_STATUS.badRequest, TUTOR_ERROR_CODES.invalidRequest);

    release = limiter.acquire(clientKey(request, config.trustedProxyHops));
    providerSignal = AbortSignal.any([request.signal, AbortSignal.timeout(config.llm.timeoutMs)]);
    providerSignal.throwIfAborted();
    const output = await complete(input.data, providerSignal);
    const { reply, actions } = parseTutorOutput(output, input.data.context.kind);
    if (!reply) throw new Error('Empty tutor response.');

    logger.info({
      event: LOG_EVENTS.tutorCompleted,
      status: HTTP_STATUS.ok,
      actions: actions.map((action) => action.type),
      ...logContext(),
    });
    return jsonResponse(requestId, HTTP_STATUS.ok, {
      reply: reply.slice(0, TUTOR_LIMITS.replyLength),
      actions,
    });
  } catch (error) {
    const { status, code, retryAfter, upstreamStatus } = classifyTutorError(
      error,
      request.signal.aborted,
      Boolean(providerSignal?.aborted),
    );
    const level = status >= HTTP_STATUS.internalServerError ? 'error' : 'warn';
    logger[level]({ event: LOG_EVENTS.tutorFailed, status, code, upstreamStatus, ...logContext() });
    return jsonResponse(requestId, status, { error: code }, retryAfter);
  } finally {
    release?.();
  }
}
