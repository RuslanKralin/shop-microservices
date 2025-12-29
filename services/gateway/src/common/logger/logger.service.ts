import { Injectable, LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',

      base: {
        service: process.env.SERVICE_NAME || 'gateway',
        env: process.env.NODE_ENV || 'development',
      },

      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,

      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }

  // Метод для создания дочернего логгера с requestId
  child(bindings: Record<string, any>): Logger {
    return this.logger.child(bindings);
  }
}
