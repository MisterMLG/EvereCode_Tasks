import config from './config/config';
import { createLogger } from './logger/logger';
import { createScheduler } from './scheduler/scheduler';
import { createDatabase } from './db/database';
import { initializeDatabase } from './db/schema';
import { createCurrencyRepository } from './repositories/currencyRepository';
import { createPriceRepository } from './repositories/priceRepository';
import { createAddressRepository } from './repositories/addressRepository';
import { createHttpClient } from './services/httpClient';
import { createBinanceClient } from './services/binanceClient';
import { createBlockchainClient } from './services/blockchainClient';
import { createPriceUpdater } from './services/priceUpdater';
import { createServer } from './server';
import { createShutdown, registerSignalHandlers } from './lifecycle/shutdown';

const logger = createLogger(config.appName, { level: config.logLevel });

const database = createDatabase(config.databasePath);
initializeDatabase(database);

const currencyRepository = createCurrencyRepository(database);
const priceRepository = createPriceRepository(database);
const addressRepository = createAddressRepository(database);

const httpClient = createHttpClient({
    timeoutMs: config.http.timeoutMs,
    retries: config.http.retries,
    retryDelayMs: config.http.retryDelayMs,
});
const binanceClient = createBinanceClient(httpClient, config.binance.baseUrl);
const blockchainClient = createBlockchainClient(httpClient, config.blockchain.baseUrl);

const app = createServer({
    authToken: config.authToken,
    currencyRepository,
    priceRepository,
    addressRepository,
    binanceClient,
    blockchainClient,
});

const scheduleTask = createScheduler(logger);
const updatePrices = createPriceUpdater({
    currencyRepository,
    priceRepository,
    binanceClient,
});

let currentUpdate: Promise<void> = Promise.resolve();

function runPriceUpdate(): Promise<void> {
    currentUpdate = updatePrices()
        .then(({ currencies, prices }) => {
            logger.info(`price update completed: ${currencies} currencies, ${prices} prices`);
        })
        .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'unknown error';
            logger.error(`price update failed: ${message}`);
        });

    return currentUpdate;
}

logger.info('application started');

const intervalHandle = scheduleTask(
    config.scheduler.taskName,
    config.scheduler.interval,
    runPriceUpdate,
);

void runPriceUpdate();

const server = app.listen(config.port, () => {
    logger.info(`server started on port ${config.port}`);
});

const shutdown = createShutdown({
    logger,
    stopTasks: () => clearInterval(intervalHandle),
    drain: () => currentUpdate,
    closeServer: () =>
        new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        }),
    closeDatabase: () => database.close(),
});

registerSignalHandlers(shutdown);
