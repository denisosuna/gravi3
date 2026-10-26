import { APIError, APIConnectionTimeoutError } from 'openai';
import { LimitError } from './rate-limiter';
import { RequestError } from './request-body';

interface TutorFailure {
  status: number;
  code: string;
  retryAfter?: number;
  upstreamStatus?: number;
}

export function classifyTutorError(
  error: unknown,
  disconnected: boolean,
  timedOut: boolean,
): TutorFailure {
  if (error instanceof RequestError) return { status: error.status, code: error.code };
  if (error instanceof LimitError)
    return { status: 429, code: 'rate_limited', retryAfter: error.retryAfter };
  if (error instanceof APIError && error.status === 429) {
    const header = error.headers?.get('retry-after');
    const numeric = Number(header);
    const seconds =
      header && Number.isFinite(numeric)
        ? numeric
        : header
          ? (Date.parse(header) - Date.now()) / 1000
          : NaN;
    return {
      status: 429,
      code: 'rate_limited',
      retryAfter: Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60,
    };
  }
  if (disconnected) return { status: 499, code: 'cancelled' };
  if (
    timedOut ||
    error instanceof APIConnectionTimeoutError ||
    (error instanceof Error && error.name === 'TimeoutError')
  )
    return { status: 504, code: 'timeout' };
  return {
    status: 502,
    code: 'provider_unavailable',
    upstreamStatus: error instanceof APIError ? error.status : undefined,
  };
}
