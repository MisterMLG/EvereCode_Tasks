const request = require('supertest');
const createServer = require('../src/server');

const validToken = 'a'.repeat(64);

function auth(requestBuilder) {
    return requestBuilder.set('Authorization', `Bearer ${validToken}`);
}

describe('currencies endpoints', () => {
    let app;

    beforeEach(() => {
        app = createServer({
            authToken: validToken,
            fetchImpl: jest.fn()
        });
    });

    test('creates and lists currencies', async () => {
        const createResponse = await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'btc' });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({ name: 'Bitcoin', ticker: 'BTC' });

        const listResponse = await auth(request(app).get('/currencies'));

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toEqual([{ name: 'Bitcoin', ticker: 'BTC' }]);
    });

    test('gets currency by ticker', async () => {
        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(app).get('/currencies/BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ name: 'Bitcoin', ticker: 'BTC' });
    });

    test('updates currency by ticker', async () => {
        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(app).put('/currencies/BTC'))
            .send({ name: 'Bitcoin Updated', ticker: 'BTC' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ name: 'Bitcoin Updated', ticker: 'BTC' });
    });

    test('deletes currency by ticker', async () => {
        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const deleteResponse = await auth(request(app).delete('/currencies/BTC'));

        expect(deleteResponse.status).toBe(204);

        const getResponse = await auth(request(app).get('/currencies/BTC'));

        expect(getResponse.status).toBe(404);
    });

    test('returns 409 when currency already exists', async () => {
        await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(app).post('/currencies'))
            .send({ name: 'Bitcoin Duplicate', ticker: 'BTC' });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Currency already exists' });
    });

    test('returns 400 when JSON body is invalid', async () => {
        const response = await auth(request(app).post('/currencies'))
            .set('Content-Type', 'application/json')
            .send('{name:"Bitcoin",ticker:"BTC"}');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid JSON body' });
    });
});
