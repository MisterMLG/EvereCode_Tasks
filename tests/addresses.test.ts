import request from 'supertest';
import { buildServer, auth, VALID_BTC_ADDRESS, type TestContext } from './testServer';
import type { BlockchainClient } from '../src/services/blockchainClient';
import { ExternalServiceError } from '../src/errors/errors';

describe('addresses endpoints', () => {
    let ctx: TestContext;
    let blockchainClient: jest.Mocked<BlockchainClient>;

    beforeEach(() => {
        blockchainClient = {
            getBlockHeight: jest.fn(),
            getAddressBalance: jest.fn(),
        };
        ctx = buildServer({ blockchainClient });
    });

    afterEach(() => {
        ctx.database.close();
    });

    async function track(address = VALID_BTC_ADDRESS, label?: string) {
        return auth(request(ctx.app).post('/addresses')).send({ address, label });
    }

    test('creates and lists addresses', async () => {
        const createResponse = await track(VALID_BTC_ADDRESS, 'Cold wallet');

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({ address: VALID_BTC_ADDRESS, label: 'Cold wallet' });

        const listResponse = await auth(request(ctx.app).get('/addresses'));

        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toEqual([{ address: VALID_BTC_ADDRESS, label: 'Cold wallet' }]);
    });

    test('gets an address by value', async () => {
        await track();

        const response = await auth(request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}`));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ address: VALID_BTC_ADDRESS, label: null });
    });

    test('updates the label of an address', async () => {
        await track();

        const response = await auth(request(ctx.app).put(`/addresses/${VALID_BTC_ADDRESS}`)).send({
            label: 'Renamed',
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ address: VALID_BTC_ADDRESS, label: 'Renamed' });
    });

    test('deletes an address', async () => {
        await track();

        const deleteResponse = await auth(request(ctx.app).delete(`/addresses/${VALID_BTC_ADDRESS}`));

        expect(deleteResponse.status).toBe(204);

        const getResponse = await auth(request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}`));

        expect(getResponse.status).toBe(404);
    });

    test('rejects unauthenticated requests with 401', async () => {
        const response = await request(ctx.app).get('/addresses');

        expect(response.status).toBe(401);
    });

    test('returns 400 for an invalid Bitcoin address', async () => {
        const response = await track('not-a-real-address');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'A valid Bitcoin address is required' });
    });

    test('returns 409 when the address is already tracked', async () => {
        await track();

        const response = await track();

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Address already exists' });
    });

    test('returns 404 when getting an untracked address', async () => {
        const response = await auth(request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}`));

        expect(response.status).toBe(404);
    });

    test('returns 404 when updating an untracked address', async () => {
        const response = await auth(request(ctx.app).put(`/addresses/${VALID_BTC_ADDRESS}`)).send({
            label: 'x',
        });

        expect(response.status).toBe(404);
    });

    test('returns 404 when deleting an untracked address', async () => {
        const response = await auth(request(ctx.app).delete(`/addresses/${VALID_BTC_ADDRESS}`));

        expect(response.status).toBe(404);
    });

    test('returns the live balance for a tracked address', async () => {
        await track();
        blockchainClient.getAddressBalance.mockResolvedValue({
            address: VALID_BTC_ADDRESS,
            balanceSat: 125000,
            confirmedSat: 120000,
            mempoolSat: 5000,
        });

        const response = await auth(
            request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}/balance`),
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            address: VALID_BTC_ADDRESS,
            balanceSat: 125000,
            confirmedSat: 120000,
            mempoolSat: 5000,
        });
        expect(blockchainClient.getAddressBalance).toHaveBeenCalledWith(VALID_BTC_ADDRESS);
    });

    test('returns 404 when requesting the balance of an untracked address', async () => {
        const response = await auth(
            request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}/balance`),
        );

        expect(response.status).toBe(404);
        expect(blockchainClient.getAddressBalance).not.toHaveBeenCalled();
    });

    test('returns 502 when the blockchain provider fails', async () => {
        await track();
        blockchainClient.getAddressBalance.mockRejectedValue(
            new ExternalServiceError('Address balance request failed'),
        );

        const response = await auth(
            request(ctx.app).get(`/addresses/${VALID_BTC_ADDRESS}/balance`),
        );

        expect(response.status).toBe(502);
    });
});