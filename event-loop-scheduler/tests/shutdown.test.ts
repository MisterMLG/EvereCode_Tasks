import { createShutdown, registerSignalHandlers } from '../src/lifecycle/shutdown';
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

describe('createShutdown', () => {
    test('tears resources down in order: stop tasks -> drain -> close server -> close db', async () => {
        const order: string[] = [];
        const shutdown = createShutdown({
            logger: createTestLogger(),
            stopTasks: () => order.push('stopTasks'),
            drain: async () => {
                order.push('drain');
            },
            closeServer: async () => {
                order.push('closeServer');
            },
            closeDatabase: () => order.push('closeDatabase'),
        });

        await shutdown('SIGTERM');

        expect(order).toEqual(['stopTasks', 'drain', 'closeServer', 'closeDatabase']);
    });

    test('is idempotent — only runs once', async () => {
        const stopTasks = jest.fn();
        const closeDatabase = jest.fn();
        const shutdown = createShutdown({
            logger: createTestLogger(),
            stopTasks,
            closeServer: async () => undefined,
            closeDatabase,
        });

        await shutdown('SIGINT');
        await shutdown('SIGTERM');

        expect(stopTasks).toHaveBeenCalledTimes(1);
        expect(closeDatabase).toHaveBeenCalledTimes(1);
    });

    test('still closes resources when draining fails', async () => {
        const closeDatabase = jest.fn();
        const logger = createTestLogger();
        const shutdown = createShutdown({
            logger,
            stopTasks: jest.fn(),
            drain: async () => {
                throw new Error('drain boom');
            },
            closeServer: async () => undefined,
            closeDatabase,
        });

        await shutdown('SIGTERM');

        expect(closeDatabase).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('drain boom'),
        );
    });
});

describe('registerSignalHandlers', () => {
    test('invokes shutdown and exits when the signal fires', async () => {
        const shutdown = jest.fn().mockResolvedValue(undefined);
        const exit = jest.fn();

        registerSignalHandlers(shutdown, { signals: ['SIGUSR2'], exit });

        process.emit('SIGUSR2', 'SIGUSR2');
        await new Promise((resolve) => setImmediate(resolve));

        expect(shutdown).toHaveBeenCalledWith('SIGUSR2');
        expect(exit).toHaveBeenCalledWith(0);
    });
});