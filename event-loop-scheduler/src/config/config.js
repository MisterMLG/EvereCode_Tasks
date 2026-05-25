const config = {
    appName: 'Event Loop App',
    logLevel: 'info',
    port: process.env.PORT || 3000,
    scheduler: {
        taskName: 'status-task',
        interval: 10000
    }
};

module.exports = config;