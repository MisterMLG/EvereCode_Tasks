const config = require('./config');
const createLogger = require('./logger');
const createScheduler = require('./scheduler');

const log = createLogger(config.appName);
const scheduleTask = createScheduler(log);

log('application started');

scheduleTask(
    config.scheduler.taskName,
    config.scheduler.interval,
    () => {
        log('running');
    }
);