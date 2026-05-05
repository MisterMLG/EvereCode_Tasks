const config = require('./config');
const createLogger = require('./logger');
const scheduleTask = require('./scheduler');

const log = createLogger(config.appName);

log('application started');

scheduleTask(
    config.scheduler.taskName,
    config.scheduler.interval,
    () => {
        log('running');
    }
);