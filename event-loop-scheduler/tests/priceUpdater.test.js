const { createDatabase } = require('../src/db/database');
const { initializeDatabase } = require('../src/db/schema');
const createCurrencyRepository = require('../src/repositories/currencyRepository');
const createPriceRepository = require('../src/repositories/priceRepository');
const {
    BINANCE_PRICES_URL,
    createPriceUpdater
} = require('../src/services/priceUpdater');

describe('priceUpdater', () => {
    let database;
    let currencyRepository;
    let priceRepository;
    let fetchImpl;
    let updatePrices;

    beforeEach(() => {
        database = createDatabase(':memory:');
        initializeDatabase(database);
        currencyRepository = createCurrencyRepository(database);
        priceRepository = createPriceRepository(database);
        fetchImpl = jest.fn();
        updatePrices = createPriceUpdater({
            currencyRepository,
            priceRepository,
            fetchImpl
        });
    });

    afterEach(() => {
        database.close();
    });

    test('picks up currencies added between runs and replaces their saved prices', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        fetchImpl.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { symbol: 'BTCUSDT', price: '65000.00000000' },
                { symbol: 'BTCBUSD', price: '64900.00000000' },
                { symbol: 'ETHUSDT', price: '3000.00000000' }
            ]
        });

        await expect(updatePrices()).resolves.toEqual({
            currencies: 1,
            prices: 2
        });
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCBUSD', price: '64900.00000000' },
            { symbol: 'BTCUSDT', price: '65000.00000000' }
        ]);

        currencyRepository.create({ name: 'Ethereum', ticker: 'ETH' });
        fetchImpl.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { symbol: 'BTCUSDT', price: '66000.00000000' },
                { symbol: 'ETHBTC', price: '0.05100000' },
                { symbol: 'ETHUSDT', price: '3100.00000000' }
            ]
        });

        await expect(updatePrices()).resolves.toEqual({
            currencies: 2,
            prices: 4
        });
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCUSDT', price: '66000.00000000' },
            { symbol: 'ETHBTC', price: '0.05100000' }
        ]);
        expect(priceRepository.listByCurrency('ETH')).toEqual([
            { symbol: 'ETHBTC', price: '0.05100000' },
            { symbol: 'ETHUSDT', price: '3100.00000000' }
        ]);
        expect(fetchImpl).toHaveBeenNthCalledWith(1, BINANCE_PRICES_URL);
        expect(fetchImpl).toHaveBeenNthCalledWith(2, BINANCE_PRICES_URL);
    });

    test('does not call Binance when no currencies are monitored', async () => {
        await expect(updatePrices()).resolves.toEqual({
            currencies: 0,
            prices: 0
        });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('keeps the previous snapshot when Binance returns an error', async () => {
        currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        priceRepository.replaceAll([
            {
                currency: 'BTC',
                prices: [{ symbol: 'BTCUSDT', price: '65000.00000000' }]
            }
        ]);
        fetchImpl.mockResolvedValue({
            ok: false,
            status: 503
        });

        await expect(updatePrices()).rejects.toThrow(
            'Binance price request failed with status 503'
        );
        expect(priceRepository.listByCurrency('BTC')).toEqual([
            { symbol: 'BTCUSDT', price: '65000.00000000' }
        ]);
    });
});