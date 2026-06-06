const request = require('supertest');
const createServer = require('../src/server');

const validToken = 'a'.repeat(64);

function auth(requestBuilder) {
    return requestBuilder.set('Authorization', `Bearer ${validToken}`);
}

describe('GET /price', () => {
    test('returns saved prices for an existing currency without calling Binance', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { symbol: 'BTCUSDT', price: '65000.00000000' },
                { symbol: 'ETHBTC', price: '0.05000000' },
                { symbol: 'ETHUSDT', price: '3000.00000000' }
            ]
        });

        const app = createServer({ authToken: validToken, fetchImpl });

        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        app.locals.priceRepository.replaceAll([
            {
                currency: 'BTC',
                prices: [
                    { symbol: 'BTCUSDT', price: '65000.00000000' },
                    { symbol: 'ETHBTC', price: '0.05000000' }
                ]
            }
        ]);

        const response = await auth(request(app).get('/price?currency=BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            currency: 'BTC',
            prices: [
                { symbol: 'BTCUSDT', price: '65000.00000000' },
                { symbol: 'ETHBTC', price: '0.05000000' }
            ]
        });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('returns 404 when currency does not exist in database', async () => {
        const fetchImpl = jest.fn();
        const app = createServer({ authToken: validToken, fetchImpl });

        const response = await auth(request(app).get('/price?currency=BTC'));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Currency not found' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('returns an empty list before the first background update', async () => {
        const app = createServer({ authToken: validToken });

        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(app).get('/price?currency=BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            currency: 'BTC',
            prices: []
        });
    });
});