import pino, { type Logger } from 'pino';

export function createLogger(level: string): Logger {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'req.headers["x-csrf-token"]',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
      ],
      censor: '[REDACTED]',
    },
  });
}
