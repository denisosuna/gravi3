import { APIError, APIConnectionTimeoutError } from 'openai';
import { HTTP_STATUS } from '@/shared/constants/http';
import { TUTOR_ERROR_CODES } from '@/features/tutor/model/tutor-contract';
import { LimitError } from './rate-limiter';
import { RequestError } from './request-body';

const DEFAULT_RETRY_AFTER_SECONDS = 60;

interface TutorFailure {
  status: number;
  code: string;
  retryAfter?: number;
  upstreamStatus?: number;
}

// Retry-After may be a number of seconds or an HTTP date.
function parseRetryAfter(header: string | null | undefined): number {
  if (!header) return DEFAULT_RETRY_AFTER_SECONDS;
  const numeric = Number(header);
  const seconds = Number.isFinite(numeric) ? numeric : (Date.parse(header) - Date.now()) / 1000;
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : DEFAULT_RETRY_AFTER_SECONDS;
}

function isTimeout(error: unknown, timedOut: boolean): boolean {
  return (
    timedOut ||
    error instanceof APIConnectionTimeoutError ||
    (error instanceof Error && error.name === 'TimeoutError')
  );
}

export function classifyTutorError(
  error: unknown,
  disconnected: boolean,
  timedOut: boolean,
): TutorFailure {
  if (error instanceof RequestError) return { status: error.status, code: error.code };
  if (error instanceof LimitError)
    return {
      status: HTTP_STATUS.tooManyRequests,
      code: TUTOR_ERROR_CODES.rateLimited,
      retryAfter: error.retryAfter,
    };
  if (error instanceof APIError && error.status === HTTP_STATUS.tooManyRequests)
    return {
      status: HTTP_STATUS.tooManyRequests,
      code: TUTOR_ERROR_CODES.rateLimited,
      retryAfter: parseRetryAfter(error.headers?.get('retry-after')),
    };
  if (disconnected)
    return { status: HTTP_STATUS.clientClosedRequest, code: TUTOR_ERROR_CODES.cancelled };
  if (isTimeout(error, timedOut))
    return { status: HTTP_STATUS.gatewayTimeout, code: TUTOR_ERROR_CODES.timeout };
  return {
    status: HTTP_STATUS.badGateway,
    code: TUTOR_ERROR_CODES.providerUnavailable,
    upstreamStatus: error instanceof APIError ? error.status : undefined,
  };
}
