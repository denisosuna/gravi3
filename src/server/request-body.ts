import { HTTP_STATUS } from '@/shared/constants/http';

const JSON_CONTENT_TYPE = 'application/json';
const MAX_BODY_BYTES = 16 * 1024;
const BODY_READ_TIMEOUT_MS = 5000;

export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export async function readJsonBody(
  request: Request,
  maximum = MAX_BODY_BYTES,
  timeoutMs = BODY_READ_TIMEOUT_MS,
): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== JSON_CONTENT_TYPE)
    throw new RequestError(HTTP_STATUS.unsupportedMediaType, 'invalid_content_type');
  if (!request.body) throw new RequestError(HTTP_STATUS.badRequest, 'empty_body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new RequestError(HTTP_STATUS.requestTimeout, 'body_timeout')),
      timeoutMs,
    );
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximum) throw new RequestError(HTTP_STATUS.payloadTooLarge, 'body_too_large');
      chunks.push(value);
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
    } catch {
      throw new RequestError(HTTP_STATUS.badRequest, 'invalid_json');
    }
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => undefined);
  }
}
