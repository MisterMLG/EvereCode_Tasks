import { createDatabase, type Database } from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { createCurrencyRepository, type CurrencyRepository } from '../src/repositories/currencyRepository';
import { createPriceRepository, type PriceRepository } from '../src/repositories/priceRepository';
import { createPriceUpdater, type PriceUpdater } from '../src/services/priceUpdater';
import type { BinanceClient } from '../src/services/binanceClient';
import { ExternalServiceError } from '../src/errors/errors';

describe('priceUpdater', () => {
    let database: Database;
    let currencyRepository: CurrencyRepository;
    let priceRepository: PriceRepository;
    let binanceClient: jest.Mocked<BinanceClient>;
    let updatePrices: PriceUpdater;

    beforeEach(() => {
        database = createDatabase(':memory:');
        initializeDatabase(database);
        currencyRepository = createCurrencyRepository(database);
        priceRepository = createPriceRepository(database);
        binanceClient = { getAllPrices: jest.fn() };
        updatePrices = createPriceUpdater({ currencyRepository, priceRepository, binanceClient });
    });

    afterEach(() => {
        database.close();
    });

    test('picks up currencies added between runs and replaces their saved prices', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        binanceClient.getAllPrices.mockResolvedValueOnce([
            { symbol: 'BTCUSDT', price: '65000.00000000' },
            { symbol: 'BTCBUSD', price: '64900.00000000' },
            { symbol: 'ETHUSDT', price: '3000.00000000' },
        ]);

        await expect(updatePrices()).resolves.toEqual({ currencies: 1, prices: 2 });
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCBUSD', price: '64900.00000000' },
            { symbol: 'BTCUSDT', price: '65000.00000000' },
        ]);

        currencyRepository.create({ name: 'Ethereum', ticker: 'ETH' });
        binanceClient.getAllPrices.mockResolvedValueOnce([
            { symbol: 'BTCUSDT', price: '66000.00000000' },
            { symbol: 'ETHBTC', price: '0.05100000' },
            { symbol: 'ETHUSDT', price: '3100.00000000' },
        ]);

        await expect(updatePrices()).resolves.toEqual({ currencies: 2, prices: 4 });
        expect(priceRepository.listByCurrency('ETH')).toEqual([
            { symbol: 'ETHBTC', price: '0.05100000' },
            { symbol: 'ETHUSDT', price: '3100.00000000' },
        ]);
        expect(binanceClient.getAllPrices).toHaveBeenCalledTimes(2);
    });

    test('does not call Binance when no currencies are monitored', async () => {
        await expect(updatePrices()).resolves.toEqual({ currencies: 0, prices: 0 });
        expect(binanceClient.getAllPrices).not.toHaveBeenCalled();
    });

    test('keeps the previous snapshot when Binance returns an error', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        priceRepository.replaceAll([
            { currency: 'BTC', prices: [{ symbol: 'BTCUSDT', price: '65000.00000000' }] },
        ]);
        binanceClient.getAllPrices.mockRejectedValue(new ExternalServiceError('Binance down'));

        await expect(updatePrices()).rejects.toThrow('Binance down');
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCUSDT', price: '65000.00000000' },
        ]);
    });
});