import 'server-only';
import pino, { type DestinationStream, type Logger } from 'pino';
import { getConfig } from './config';

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

let processLogger: Logger | undefined;

export function getLogger(): Logger {
  processLogger ??= createLogger(getConfig().logLevel);
  return processLogger;
}
