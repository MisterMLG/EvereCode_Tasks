import { SchedulerValidationError } from '../errors/errors';
import type { Logger } from '../logger/logger';

export type ScheduledTask = () => void | Promise<unknown>;

export type ScheduleTask = (name: string, interval: number, task: ScheduledTask) => NodeJS.Timeout;

export function createScheduler(logger: Logger): ScheduleTask {
    if (typeof logger.info !== 'function') {
        throw new SchedulerValidationError('Logger must provide an info method');
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

export default createScheduler;