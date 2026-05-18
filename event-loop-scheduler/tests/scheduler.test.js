const createScheduler = require('../src/scheduler/scheduler');
const { InvalidTaskNameError } = require('../src/errors/errors');

describe('scheduler', () => {
    test('throws InvalidTaskNameError when task name is empty', () => {
        const logger = {
            info: jest.fn()
        };
        const scheduleTask = createScheduler(logger);

        expect(() => scheduleTask('', 1000, jest.fn())).toThrow(InvalidTaskNameError);
    });
});
