const createScheduler = require('../src/scheduler/scheduler');
const { SchedulerValidationError } = require('../src/errors/errors');

describe('scheduler', () => {
    test('throws SchedulerValidationError when task name is empty', () => {
        const logger = {
            info: jest.fn()
        };
        const scheduleTask = createScheduler(logger);

        expect(() => scheduleTask('', 1000, jest.fn())).toThrow(SchedulerValidationError);
        expect(() => scheduleTask('', 1000, jest.fn()))
            .toThrow('Task name must be a non-empty string');
    });
});