import request from 'supertest';
import { createDatabase, type Database } from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { createCurrencyRepository, type CurrencyRepository } from '../src/repositories/currencyRepository';
import { createPriceRepository, type PriceRepository } from '../src/repositories/priceRepository';
import { createAddressRepository, type AddressRepository } from '../src/repositories/addressRepository';
import { createServer } from '../src/server';
import type { BinanceClient } from '../src/services/binanceClient';
import type { BlockchainClient } from '../src/services/blockchainClient';

export const VALID_TOKEN = 'a'.repeat(64);
export const INVALID_TOKEN = 'b'.repeat(64);

export const VALID_BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

export function auth(req: request.Test): request.Test {
    return req.set('Authorization', `Bearer ${VALID_TOKEN}`);
}

export interface TestContext {
    app: ReturnType<typeof createServer>;
    database: Database;
    currencyRepository: CurrencyRepository;
    priceRepository: PriceRepository;
    addressRepository: AddressRepository;
}

export interface TestOverrides {
    binanceClient?: BinanceClient;
    blockchainClient?: BlockchainClient;
}

export function buildServer(overrides: TestOverrides = {}): TestContext {
    const database = createDatabase(':memory:');
    initializeDatabase(database);

    const currencyRepository = createCurrencyRepository(database);
    const priceRepository = createPriceRepository(database);
    const addressRepository = createAddressRepository(database);

    const app = createServer({
        authToken: VALID_TOKEN,
        currencyRepository,
        priceRepository,
        addressRepository,
        binanceClient: overrides.binanceClient,
        blockchainClient: overrides.blockchainClient,
    });

    return { app, database, currencyRepository, priceRepository, addressRepository };
}