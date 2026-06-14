import { createScheduler } from '../src/scheduler/scheduler';
import { SchedulerValidationError } from '../src/errors/errors';
import type { Logger } from '../src/logger/logger';

function createTestLogger(): Logger {
    return {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
    };
}

describe('scheduler', () => {
    test('runs the task on every interval tick', () => {
        jest.useFakeTimers();
        try {
            const logger = createTestLogger();
            const scheduleTask = createScheduler(logger);
            const task = jest.fn();

            const handle = scheduleTask('price-update', 1000, task);

            expect(logger.info).toHaveBeenCalledWith(
                'task "price-update" registered with interval 1000 ms',
            );

            jest.advanceTimersByTime(3000);
            expect(task).toHaveBeenCalledTimes(3);

            clearInterval(handle);
        } finally {
            jest.useRealTimers();
        }
    });

    test('throws SchedulerValidationError when the task name is empty', () => {
        const scheduleTask = createScheduler(createTestLogger());

        expect(() => scheduleTask('', 1000, jest.fn())).toThrow(SchedulerValidationError);
        expect(() => scheduleTask('', 1000, jest.fn())).toThrow(
            'Task name must be a non-empty string',
        );
    });

    test('throws SchedulerValidationError when the interval is not a positive integer', () => {
        const scheduleTask = createScheduler(createTestLogger());

        expect(() => scheduleTask('task', 0, jest.fn())).toThrow(SchedulerValidationError);
        expect(() => scheduleTask('task', -5, jest.fn())).toThrow(SchedulerValidationError);
    });
});