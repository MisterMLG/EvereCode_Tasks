require('dotenv').config();
const path = require('path');

const config = {
    appName: 'Event Loop App',
    logLevel: 'info',
    port: process.env.PORT || 3000,
    authToken: process.env.AUTH_TOKEN,
    databasePath: process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'app.sqlite'),
    scheduler: {
        taskName: 'price-update',
        interval: 60_000
    }
};

module.exports = config;