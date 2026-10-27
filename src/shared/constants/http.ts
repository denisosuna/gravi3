export const HTTP_STATUS = {
  ok: 200,
  badRequest: 400,
  forbidden: 403,
  requestTimeout: 408,
  payloadTooLarge: 413,
  unsupportedMediaType: 415,
  tooManyRequests: 429,
  clientClosedRequest: 499,
  internalServerError: 500,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeout: 504,
} as const;

export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;
