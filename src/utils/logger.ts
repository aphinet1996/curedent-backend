import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment';

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define log level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};

// Add colors to winston
winston.addColors(colors);

// Create custom format
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
  }),
  winston.format.colorize({ all: true }),
);

// Create file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define the log level based on environment
const level = () => {
  if (config.NODE_ENV === 'development') return 'debug';
  if (config.NODE_ENV === 'test') return 'warn';
  return config.LOG_LEVEL || 'info';
};

// Configure transports
const transports: winston.transport[] = [
  // Console transport (all logs)
  new winston.transports.Console({
    level: level(),
    format: consoleFormat,
  }),
];

// Add file transports in production mode
if (config.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan integration
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Create a simple logger for development with just namespace prefixing
export const createNamespacedLogger = (namespace: string) => {
  return {
    error: (message: string, meta?: any) => logger.error(`[${namespace}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${namespace}] ${message}`, meta),
    info: (message: string, meta?: any) => logger.info(`[${namespace}] ${message}`, meta),
    http: (message: string, meta?: any) => logger.http(`[${namespace}] ${message}`, meta),
    verbose: (message: string, meta?: any) => logger.verbose(`[${namespace}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${namespace}] ${message}`, meta),
    silly: (message: string, meta?: any) => logger.silly(`[${namespace}] ${message}`, meta),
  };
};

// Export default logger
export default logger;