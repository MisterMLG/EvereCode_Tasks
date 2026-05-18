const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};

function createLogger(appName, options = {}) {
    const minLevel = options.level || 'info';

    if (!Object.hasOwn(LOG_LEVELS, minLevel)) {
        throw new Error(`Unknown log level: ${minLevel}`);
    }

    function shouldLog(level) {
        return LOG_LEVELS[level] <= LOG_LEVELS[minLevel];
    }

    function formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const requestId = context.requestId ? ` [requestId=${context.requestId}]` : '';

        return `[${timestamp}] [${level.toUpperCase()}] [${appName}]${requestId} ${message}`;
    }

    function write(level, message, context) {
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
        trace: (message, context) => write('trace', message, context)
    };
}

module.exports = createLogger;