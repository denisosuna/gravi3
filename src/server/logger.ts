import 'server-only';
import pino, { type DestinationStream } from 'pino';

export function createLogger(level = 'info', destination?: DestinationStream) {
  const options = {
    level,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'apiKey',
        'authorization',
        'cookie',
        'body',
        'messages',
        'history',
        'content',
        'request',
        'response',
        '*.apiKey',
        '*.authorization',
        '*.cookie',
        '*.body',
        '*.messages',
        '*.history',
        '*.content',
      ],
      censor: '[REDACTED]',
    },
  };
  return destination ? pino(options, destination) : pino(options);
}

export const logger = createLogger(process.env.LOG_LEVEL || 'info');
