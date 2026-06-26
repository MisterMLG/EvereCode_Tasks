import { createDatabase, type Database } from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { createCurrencyRepository, type CurrencyRepository } from '../src/repositories/currencyRepository';
import { createPriceRepository, type PriceRepository } from '../src/repositories/priceRepository';
import { createPriceUpdater, type PriceUpdater } from '../src/services/priceUpdater';
import type { CoingeckoClient } from '../src/services/coingeckoClient';
import { ExternalServiceError } from '../src/errors/errors';

describe('priceUpdater', () => {
    let database: Database;
    let currencyRepository: CurrencyRepository;
    let priceRepository: PriceRepository;
    let coingeckoClient: jest.Mocked<CoingeckoClient>;
    let updatePrices: PriceUpdater;

    beforeEach(() => {
        database = createDatabase(':memory:');
        initializeDatabase(database);
        currencyRepository = createCurrencyRepository(database);
        priceRepository = createPriceRepository(database);
        coingeckoClient = { getAllPrices: jest.fn() };
        updatePrices = createPriceUpdater({ currencyRepository, priceRepository, coingeckoClient });
    });

    afterEach(() => {
        database.close();
    });

    test('picks up currencies added between runs and replaces their saved prices', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        coingeckoClient.getAllPrices.mockResolvedValueOnce([
            { symbol: 'BTCUSD', price: '65000' },
            { symbol: 'ETHUSD', price: '3000' },
        ]);

        await expect(updatePrices()).resolves.toEqual({ currencies: 1, prices: 1 });
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCUSD', price: '65000' },
        ]);

        currencyRepository.create({ name: 'Ethereum', ticker: 'ETH' });
        coingeckoClient.getAllPrices.mockResolvedValueOnce([
            { symbol: 'BTCUSD', price: '66000' },
            { symbol: 'ETHUSD', price: '3100' },
        ]);

        await expect(updatePrices()).resolves.toEqual({ currencies: 2, prices: 2 });
        expect(priceRepository.listByCurrency('ETH')).toEqual([
            { symbol: 'ETHUSD', price: '3100' },
        ]);
        expect(coingeckoClient.getAllPrices).toHaveBeenCalledTimes(2);
    });

    test('does not call CoinGecko when no currencies are monitored', async () => {
        await expect(updatePrices()).resolves.toEqual({ currencies: 0, prices: 0 });
        expect(coingeckoClient.getAllPrices).not.toHaveBeenCalled();
    });

    test('keeps the previous snapshot when CoinGecko returns an error', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        priceRepository.replaceAll([
            { currency: 'BTC', prices: [{ symbol: 'BTCUSD', price: '65000' }] },
        ]);
        coingeckoClient.getAllPrices.mockRejectedValue(new ExternalServiceError('CoinGecko down'));

        await expect(updatePrices()).rejects.toThrow('CoinGecko down');
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCUSD', price: '65000' },
        ]);
    });
});
