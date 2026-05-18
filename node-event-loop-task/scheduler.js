const {
    InvalidLoggerError,
    InvalidTaskNameError,
    InvalidTaskIntervalError,
    InvalidTaskHandlerError
} = require('./errors');

function createScheduler(log) {
    if (typeof log !== 'function') {
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

        log(`task "${name}" registered with interval ${interval} ms`);

        return setInterval(() => {
            log(`task "${name}" running`);
            task();
        }, interval);
    };
}

module.exports = createScheduler;