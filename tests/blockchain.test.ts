import request from 'supertest';
import { buildServer, auth, type TestContext } from './testServer';
import type { BlockchainClient } from '../src/services/blockchainClient';
import { ExternalServiceError } from '../src/errors/errors';

describe('GET /blockchain/height', () => {
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

    test('returns the current block height', async () => {
        blockchainClient.getBlockHeight.mockResolvedValue(840000);

        const response = await auth(request(ctx.app).get('/blockchain/height'));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ height: 840000 });
        expect(blockchainClient.getBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('returns 401 when unauthenticated', async () => {
        const response = await request(ctx.app).get('/blockchain/height');

        expect(response.status).toBe(401);
        expect(blockchainClient.getBlockHeight).not.toHaveBeenCalled();
    });

    test('returns 502 when the blockchain provider fails', async () => {
        blockchainClient.getBlockHeight.mockRejectedValue(
            new ExternalServiceError('Block height request failed'),
        );

        const response = await auth(request(ctx.app).get('/blockchain/height'));

        expect(response.status).toBe(502);
    });
});