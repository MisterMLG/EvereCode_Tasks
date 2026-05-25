const config = require('./config/config');
const createLogger = require('./logger/logger');
const createScheduler = require('./scheduler/scheduler');
const app = require('./server');

const logger = createLogger(config.appName, {
    level: config.logLevel
});

const scheduleTask = createScheduler(logger);

logger.info('application started');

scheduleTask(
    config.scheduler.taskName,
    config.scheduler.interval,
    () => {
        logger.info('running');
    }
);

app.listen(config.port, () => {
    logger.info(`server started on port ${config.port}`);
});