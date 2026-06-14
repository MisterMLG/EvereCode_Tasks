import request from 'supertest';
import { buildServer, auth, type TestContext } from './testServer';

describe('currencies endpoints', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = buildServer();
    });

    afterEach(() => {
        ctx.database.close();
    });

    test('creates and lists currencies (normalising the ticker)', async () => {
        const createResponse = await auth(request(ctx.app).post('/currencies')).send({
            name: 'Bitcoin',
            ticker: 'btc',
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({ name: 'Bitcoin', ticker: 'BTC' });

        const listResponse = await auth(request(ctx.app).get('/currencies'));

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toEqual([{ name: 'Bitcoin', ticker: 'BTC' }]);
    });

    test('gets currency by ticker', async () => {
        await auth(request(ctx.app).post('/currencies')).send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(ctx.app).get('/currencies/BTC'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ name: 'Bitcoin', ticker: 'BTC' });
    });

    test('updates currency by ticker', async () => {
        await auth(request(ctx.app).post('/currencies')).send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(ctx.app).put('/currencies/BTC')).send({
            name: 'Bitcoin Updated',
            ticker: 'BTC',
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ name: 'Bitcoin Updated', ticker: 'BTC' });
    });

    test('deletes currency by ticker', async () => {
        await auth(request(ctx.app).post('/currencies')).send({ name: 'Bitcoin', ticker: 'BTC' });

        const deleteResponse = await auth(request(ctx.app).delete('/currencies/BTC'));

        expect(deleteResponse.status).toBe(204);

        const getResponse = await auth(request(ctx.app).get('/currencies/BTC'));

        expect(getResponse.status).toBe(404);
    });

    test('rejects unauthenticated requests with 401', async () => {
        const response = await request(ctx.app).get('/currencies');

        expect(response.status).toBe(401);
    });

    test('returns 400 when the name is missing', async () => {
        const response = await auth(request(ctx.app).post('/currencies')).send({ ticker: 'BTC' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Currency name is required' });
    });

    test('returns 400 when the ticker format is invalid', async () => {
        const response = await auth(request(ctx.app).post('/currencies')).send({
            name: 'Bad',
            ticker: 'b',
        });

        expect(response.status).toBe(400);
    });

    test('returns 409 when currency already exists', async () => {
        await auth(request(ctx.app).post('/currencies')).send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(ctx.app).post('/currencies')).send({
            name: 'Bitcoin Duplicate',
            ticker: 'BTC',
        });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Currency already exists' });
    });

    test('returns 400 when the JSON body is malformed', async () => {
        const response = await auth(request(ctx.app).post('/currencies'))
            .set('Content-Type', 'application/json')
            .send('{name:"Bitcoin",ticker:"BTC"}');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid JSON body' });
    });

    test('returns 404 when getting an unknown currency', async () => {
        const response = await auth(request(ctx.app).get('/currencies/DOGE'));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Currency not found' });
    });

    test('returns 400 when URL and body tickers do not match on update', async () => {
        await auth(request(ctx.app).post('/currencies')).send({ name: 'Bitcoin', ticker: 'BTC' });

        const response = await auth(request(ctx.app).put('/currencies/BTC')).send({
            name: 'Ethereum',
            ticker: 'ETH',
        });

        expect(response.status).toBe(400);
    });

    test('returns 404 when updating an unknown currency', async () => {
        const response = await auth(request(ctx.app).put('/currencies/DOGE')).send({
            name: 'Dogecoin',
            ticker: 'DOGE',
        });

        expect(response.status).toBe(404);
    });

    test('returns 404 when deleting an unknown currency', async () => {
        const response = await auth(request(ctx.app).delete('/currencies/DOGE'));

        expect(response.status).toBe(404);
    });
});