const {
    InvalidLoggerError,
    InvalidTaskNameError,
    InvalidTaskIntervalError,
    InvalidTaskHandlerError
} = require('../errors/errors');

function createScheduler(logger) {
    if (typeof logger.info !== 'function') {
        throw new InvalidLoggerError();
    }

    return function scheduleTask(name, interval, task) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new InvalidTaskNameError();
        }

        if (!Number.isInteger(interval) || interval <= 0) {
            throw new InvalidTaskIntervalError();
        }

        if (typeof task !== 'function') {
            throw new InvalidTaskHandlerError();
        }

        logger.info(`task "${name}" registered with interval ${interval} ms`);

        return setInterval(() => {
            logger.info(`task "${name}" running`);
            task();
        }, interval);
    };
}

module.exports = createScheduler;