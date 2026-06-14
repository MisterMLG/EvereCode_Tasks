const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export interface LogContext {
    requestId?: string;
}

export interface Logger {
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    trace(message: string, context?: LogContext): void;
}

export interface LoggerOptions {
    level?: LogLevel;
}

function isLogLevel(value: string): value is LogLevel {
    return Object.prototype.hasOwnProperty.call(LOG_LEVELS, value);
}

export function createLogger(appName: string, options: LoggerOptions = {}): Logger {
    const minLevel: LogLevel = options.level ?? 'info';

    if (!isLogLevel(minLevel)) {
        throw new Error(`Unknown log level: ${minLevel}`);
    }

    function shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] <= LOG_LEVELS[minLevel];
    }

    function formatMessage(level: LogLevel, message: string, context: LogContext = {}): string {
        const timestamp = new Date().toISOString();
        const requestId = context.requestId ? ` [requestId=${context.requestId}]` : '';

        return `[${timestamp}] [${level.toUpperCase()}] [${appName}]${requestId} ${message}`;
    }

    function write(level: LogLevel, message: string, context?: LogContext): void {
        if (!shouldLog(level)) {
            return;
        }

        const formattedMessage = formatMessage(level, message, context);

        if (level === 'error') {
            console.error(formattedMessage);
            return;
        }

        if (level === 'warn') {
            console.warn(formattedMessage);
            return;
        }

        console.log(formattedMessage);
    }

    return {
        error: (message, context) => write('error', message, context),
        warn: (message, context) => write('warn', message, context),
        info: (message, context) => write('info', message, context),
        debug: (message, context) => write('debug', message, context),
        trace: (message, context) => write('trace', message, context),
    };
}

export default createLogger;