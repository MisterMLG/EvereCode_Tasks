const express = require('express');
const createAuthMiddleware = require('./middleware/auth');
const createCurrencyStore = require('./store/currencyStore');
const createCurrenciesRouter = require('./routes/currencies');
const createPriceRouter = require('./routes/price');
const errorHandler = require('./middleware/errorHandler');
const openApiSpec = require('./openapi/openapi');

function createServer({ authToken, fetchImpl = global.fetch }) {
    const app = express();
    const authMiddleware = createAuthMiddleware(authToken);
    const currencyStore = createCurrencyStore();

    app.use(express.json());

    app.get('/openapi.json', (req, res) => {
        res.json(openApiSpec);
    });

    app.get('/status', authMiddleware, (req, res) => {
        res.send('ok');
    });

    app.use('/currencies', authMiddleware, createCurrenciesRouter(currencyStore));
    app.use('/price', authMiddleware, createPriceRouter({ currencyStore, fetchImpl }));
    app.use(errorHandler);

    return app;
}

module.exports = createServer;
