const { SchedulerValidationError } = require('../errors/errors');

function createScheduler(logger) {
    if (typeof logger.info !== 'function') {
        throw new SchedulerValidationError('Logger must be a function');
    }

    return function scheduleTask(name, interval, task) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new SchedulerValidationError('Task name must be a non-empty string');
        }

        if (!Number.isInteger(interval) || interval <= 0) {
            throw new SchedulerValidationError('Interval must be a positive integer');
        }

        if (typeof task !== 'function') {
            throw new SchedulerValidationError('Task must be a function');
        }

        logger.info(`task "${name}" registered with interval ${interval} ms`);

        return setInterval(() => {
            logger.info(`task "${name}" running`);
            task();
        }, interval);
    };
}

module.exports = createScheduler;
