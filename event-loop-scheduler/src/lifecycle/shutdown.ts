import type { Logger } from '../logger/logger';

export interface ShutdownDeps {
    logger: Logger;

    stopTasks: () => void;

    drain?: () => Promise<unknown>;

    closeServer: () => Promise<void>;

    closeDatabase: () => void;
}

export type Shutdown = (signal?: string) => Promise<void>;


export function createShutdown(deps: ShutdownDeps): Shutdown {
    let started = false;

    return async function shutdown(signal?: string): Promise<void> {
        if (started) {
            return;
        }
        started = true;

        deps.logger.info(`received ${signal ?? 'shutdown'}, stopping background tasks`);
        deps.stopTasks();

        if (deps.drain) {
            try {
                await deps.drain();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                deps.logger.error(`error while draining background tasks: ${message}`);
            }
        }

        await deps.closeServer();
        deps.closeDatabase();

        deps.logger.info('shutdown complete');
    };
}

export function registerSignalHandlers(
    shutdown: Shutdown,
    options: {
        signals?: NodeJS.Signals[];
        exit?: (code: number) => void;
    } = {},
): void {
    const signals = options.signals ?? ['SIGINT', 'SIGTERM'];
    const exit = options.exit ?? ((code: number) => process.exit(code));

    for (const signal of signals) {
        process.once(signal, () => {
            shutdown(signal).then(
                () => exit(0),
                () => exit(1),
            );
        });
    }
}