function createLogger(appName) {
    return function log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${appName}] ${message}`);
    };
}

module.exports = createLogger;