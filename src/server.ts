import express, { type Express } from 'express';
import config from './config/config';
import { createAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { createDatabase, type Database } from './db/database';
import { initializeDatabase } from './db/schema';
import { createCurrencyRepository, type CurrencyRepository } from './repositories/currencyRepository';
import { createPriceRepository, type PriceRepository } from './repositories/priceRepository';
import { createAddressRepository, type AddressRepository } from './repositories/addressRepository';
import { createHttpClient } from './services/httpClient';
import { createCoingeckoClient, type CoingeckoClient } from './services/coingeckoClient';
import { createBlockchainClient, type BlockchainClient } from './services/blockchainClient';
import { createCurrenciesRouter } from './routes/currencies';
import { createPriceRouter } from './routes/price';
import { createAddressesRouter } from './routes/addresses';
import { createBlockchainRouter } from './routes/blockchain';
import openApiSpec from './openapi/openapi';

export interface CreateServerOptions {
    authToken: string | undefined;
    databasePath?: string;
    currencyRepository?: CurrencyRepository;
    priceRepository?: PriceRepository;
    addressRepository?: AddressRepository;
    coingeckoClient?: CoingeckoClient;
    blockchainClient?: BlockchainClient;
}

export function createServer(options: CreateServerOptions): Express {
    const {
        authToken,
        databasePath = ':memory:',
        currencyRepository,
        priceRepository,
        addressRepository,
        coingeckoClient,
        blockchainClient,
    } = options;

    const needsDatabase = !(currencyRepository && priceRepository && addressRepository);
    const database: Database | null = needsDatabase ? createDatabase(databasePath) : null;

    if (database) {
        initializeDatabase(database);
    }

    const currencies = currencyRepository ?? createCurrencyRepository(database as Database);
    const prices = priceRepository ?? createPriceRepository(database as Database);
    const addresses = addressRepository ?? createAddressRepository(database as Database);

    const defaultHttpClient = createHttpClient({
        timeoutMs: config.http.timeoutMs,
        retries: config.http.retries,
        retryDelayMs: config.http.retryDelayMs,
    });
    const coingecko = coingeckoClient ?? createCoingeckoClient(defaultHttpClient, config.coingecko.baseUrl);
    const blockchain =
        blockchainClient ?? createBlockchainClient(defaultHttpClient, config.blockchain.baseUrl);

    const app = express();
    const authMiddleware = createAuthMiddleware(authToken);

    if (database) {
        app.locals.database = database;
    }
    app.locals.currencyRepository = currencies;
    app.locals.priceRepository = prices;
    app.locals.addressRepository = addresses;
    app.locals.coingeckoClient = coingecko;
    app.locals.blockchainClient = blockchain;

    app.use(express.json());

    app.get('/openapi.json', (_req, res) => {
        res.json(openApiSpec);
    });

    app.get('/status', authMiddleware, (_req, res) => {
        res.send('ok');
    });

    app.use('/currencies', authMiddleware, createCurrenciesRouter(currencies));
    app.use('/price', authMiddleware, createPriceRouter({
        currencyRepository: currencies,
        priceRepository: prices,
    }));
    app.use('/addresses', authMiddleware, createAddressesRouter({
        addressRepository: addresses,
        blockchainClient: blockchain,
    }));
    app.use('/blockchain', authMiddleware, createBlockchainRouter({
        blockchainClient: blockchain,
    }));

    app.use(errorHandler);

    return app;
}

export default createServer;
