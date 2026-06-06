const express = require('express');
const createAuthMiddleware = require('./middleware/auth');
const { createDatabase } = require('./db/database');
const { initializeDatabase } = require('./db/schema');
const createCurrencyRepository = require('./repositories/currencyRepository');
const createPriceRepository = require('./repositories/priceRepository');
const createCurrenciesRouter = require('./routes/currencies');
const createPriceRouter = require('./routes/price');
const errorHandler = require('./middleware/errorHandler');
const openApiSpec = require('./openapi/openapi');

function createServer({
    authToken,
    databasePath = ':memory:',
    currencyRepository,
    priceRepository
}) {
    const app = express();
    const authMiddleware = createAuthMiddleware(authToken);
    const database = currencyRepository && priceRepository
        ? null
        : createDatabase(databasePath);

    if (database) {
        initializeDatabase(database);
        app.locals.database = database;
    }

    const currencies = currencyRepository || createCurrencyRepository(database);
    const prices = priceRepository || createPriceRepository(database);

    app.locals.currencyRepository = currencies;
    app.locals.priceRepository = prices;

    app.use(express.json());

    app.get('/openapi.json', (req, res) => {
        res.json(openApiSpec);
    });

    app.get('/status', authMiddleware, (req, res) => {
        res.send('ok');
    });

    app.use('/currencies', authMiddleware, createCurrenciesRouter(currencies));
    app.use('/price', authMiddleware, createPriceRouter({
        currencyRepository: currencies,
        priceRepository: prices
    }));
    app.use(errorHandler);

    return app;
}

module.exports = createServer;