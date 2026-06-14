import request from 'supertest';
import { buildServer, auth, type TestContext } from './testServer';

describe('GET /price', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = buildServer();
    });

    afterEach(() => {
        ctx.database.close();
    });

    test('returns saved prices for an existing currency', async () => {
        ctx.currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        ctx.priceRepository.replaceAll([
            {
                currency: 'BTC',
                prices: [
                    { symbol: 'BTCUSDT', price: '65000.00000000' },
                    { symbol: 'BTCBUSD', price: '64900.00000000' },
                ],
            },
        ]);

        const response = await auth(request(ctx.app).get('/price?currency=BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            currency: 'BTC',
            prices: [
                { symbol: 'BTCBUSD', price: '64900.00000000' },
                { symbol: 'BTCUSDT', price: '65000.00000000' },
            ],
        });
    });

    test('returns an empty list before the first background update', async () => {
        ctx.currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(ctx.app).get('/price?currency=BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ currency: 'BTC', prices: [] });
    });

    test('returns 400 when the currency query parameter is missing', async () => {
        const response = await auth(request(ctx.app).get('/price'));

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'currency query parameter is required' });
    });

    test('returns 404 when the currency is not tracked', async () => {
        const response = await auth(request(ctx.app).get('/price?currency=BTC'));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Currency not found' });
    });

    test('rejects unauthenticated requests with 401', async () => {
        const response = await request(ctx.app).get('/price?currency=BTC');

        expect(response.status).toBe(401);
    });
});

describe('GET /price/:ticker/history', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = buildServer();
        ctx.currencyRepository.create({ name: 'Bitcoin', ticker: 'BTC' });
        ctx.priceRepository.appendHistory([
            { currency: 'BTC', prices: [{ symbol: 'BTCUSDT', price: '65000.00000000' }] },
        ]);
        ctx.priceRepository.appendHistory([
            { currency: 'BTC', prices: [{ symbol: 'BTCUSDT', price: '66000.00000000' }] },
        ]);
    });

    afterEach(() => {
        ctx.database.close();
    });

    test('returns recorded history newest-first', async () => {
        const response = await auth(request(ctx.app).get('/price/BTC/history'));

        expect(response.status).toBe(200);
        expect(response.body.currency).toBe('BTC');
        expect(response.body.symbol).toBeNull();
        expect(response.body.history).toHaveLength(2);
        expect(response.body.history.map((entry: { price: string }) => entry.price)).toEqual([
            '66000.00000000',
            '65000.00000000',
        ]);
        expect(response.body.history[0]).toHaveProperty('recordedAt');
    });

    test('honours the limit query parameter', async () => {
        const response = await auth(request(ctx.app).get('/price/BTC/history?limit=1'));

        expect(response.status).toBe(200);
        expect(response.body.history).toHaveLength(1);
        expect(response.body.history[0].price).toBe('66000.00000000');
    });

    test('returns 400 for an invalid limit', async () => {
        const response = await auth(request(ctx.app).get('/price/BTC/history?limit=abc'));

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'limit must be a positive integer' });
    });

    test('returns 404 for an unknown currency', async () => {
        const response = await auth(request(ctx.app).get('/price/DOGE/history'));

        expect(response.status).toBe(404);
    });

    test('rejects unauthenticated requests with 401', async () => {
        const response = await request(ctx.app).get('/price/BTC/history');

        expect(response.status).toBe(401);
    });
});