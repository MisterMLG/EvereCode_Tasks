const express = require('express');
const createAuthMiddleware = require('./middleware/auth');
const { createDatabase } = require('./db/database');
const { initializeDatabase } = require('./db/schema');
const createCurrencyRepository = require('./repositories/currencyRepository');
const createCurrenciesRouter = require('./routes/currencies');
const createPriceRouter = require('./routes/price');
const errorHandler = require('./middleware/errorHandler');
const openApiSpec = require('./openapi/openapi');

function createServer({
    authToken,
    fetchImpl = global.fetch,
    databasePath = ':memory:',
    currencyRepository
}) {
    const app = express();
    const authMiddleware = createAuthMiddleware(authToken);
    const database = currencyRepository ? null : createDatabase(databasePath);

    if (database) {
        initializeDatabase(database);
        app.locals.database = database;
    }

    const repository = currencyRepository || createCurrencyRepository(database);

    app.use(express.json());

    app.get('/openapi.json', (req, res) => {
        res.json(openApiSpec);
    });

    app.get('/status', authMiddleware, (req, res) => {
        res.send('ok');
    });

    app.use('/currencies', authMiddleware, createCurrenciesRouter(repository));
    app.use('/price', authMiddleware, createPriceRouter({ currencyRepository: repository, fetchImpl }));
    app.use(errorHandler);

    return app;
}

module.exports = createServer;