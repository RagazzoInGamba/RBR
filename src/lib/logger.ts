/**
 * Red Bull Racing - Structured Logger
 * Winston-based logger for production-grade logging
 * Use only in API routes and server components
 */

import winston from 'winston';

// Environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
  })
);

// Custom format for production (JSON for log aggregation tools)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: {
    service: 'rbr-meal-booking',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Don't exit on error
  exitOnError: false,
});

// Add file transports in production
if (isProduction) {
  // Error logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined logs
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Helper methods for contextual logging
export const createLogger = (context: string) => {
  return {
    debug: (message: string, meta?: any) =>
      logger.debug(message, { context, ...meta }),
    info: (message: string, meta?: any) =>
      logger.info(message, { context, ...meta }),
    warn: (message: string, meta?: any) =>
      logger.warn(message, { context, ...meta }),
    error: (message: string, error?: Error | any, meta?: any) => {
      const errorMeta = error instanceof Error
        ? { error: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
      logger.error(message, { context, ...errorMeta });
    },
  };
};

// Export default logger
export default logger;

// Export named logger for convenience
export { logger };

// Export common loggers
export const authLogger = createLogger('AUTH');
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('DATABASE');
export const cacheLogger = createLogger('CACHE');
