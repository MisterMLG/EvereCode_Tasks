const config = require('./config/config');
const createLogger = require('./logger/logger');
const createScheduler = require('./scheduler/scheduler');
const { createPriceUpdater } = require('./services/priceUpdater');
const createServer = require('./server');

const logger = createLogger(config.appName, {
    level: config.logLevel
});

const scheduleTask = createScheduler(logger);
const app = createServer({
    authToken: config.authToken,
    databasePath: config.databasePath
});
const updatePrices = createPriceUpdater({
    currencyRepository: app.locals.currencyRepository,
    priceRepository: app.locals.priceRepository
});

function runPriceUpdate() {
    return updatePrices()
        .then(({ currencies, prices }) => {
            logger.info(`price update completed: ${currencies} currencies, ${prices} prices`);
        })
        .catch((error) => {
            logger.error(`price update failed: ${error.message}`);
        });
}

logger.info('application started');

scheduleTask(
    config.scheduler.taskName,
    config.scheduler.interval,
    runPriceUpdate
);

runPriceUpdate();

app.listen(config.port, () => {
    logger.info(`server started on port ${config.port}`);
});