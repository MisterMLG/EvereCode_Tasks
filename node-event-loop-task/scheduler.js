function createScheduler(log) {
    if (typeof log !== 'function') {
        throw new Error('Logger must be a function');
    }

    return function scheduleTask(name, interval, task) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Task name must be a non-empty string');
        }

        if (!Number.isInteger(interval) || interval <= 0) {
            throw new Error('Interval must be a positive integer');
        }

        if (typeof task !== 'function') {
            throw new Error('Task must be a function');
        }

        log(`task "${name}" registered with interval ${interval} ms`);

        return setInterval(() => {
            log(`task "${name}" running`);
            task();
        }, interval);
    };
}

module.exports = createScheduler;