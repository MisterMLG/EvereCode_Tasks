import type { AxiosInstance } from 'axios';
import { createBlockchainClient } from '../src/services/blockchainClient';
import { ExternalServiceError } from '../src/errors/errors';

const BASE_URL = 'https://blockstream.info/api';
const ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

function mockHttp(get: jest.Mock): AxiosInstance {
    return { get } as unknown as AxiosInstance;
}

describe('blockchainClient.getBlockHeight', () => {
    test('returns the block height as a number', async () => {
        const get = jest.fn().mockResolvedValue({ data: 840000 });
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getBlockHeight()).resolves.toBe(840000);
        expect(get).toHaveBeenCalledWith(`${BASE_URL}/blocks/tip/height`);
    });

    test('throws ExternalServiceError when the request fails', async () => {
        const get = jest.fn().mockRejectedValue(new Error('timeout'));
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getBlockHeight()).rejects.toBeInstanceOf(ExternalServiceError);
    });

    test('throws ExternalServiceError when the response is not a number', async () => {
        const get = jest.fn().mockResolvedValue({ data: 'not-a-number' });
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getBlockHeight()).rejects.toBeInstanceOf(ExternalServiceError);
    });
});

describe('blockchainClient.getAddressBalance', () => {
    test('computes confirmed, mempool and total satoshis', async () => {
        const get = jest.fn().mockResolvedValue({
            data: {
                chain_stats: { funded_txo_sum: 120000, spent_txo_sum: 0 },
                mempool_stats: { funded_txo_sum: 5000, spent_txo_sum: 0 },
            },
        });
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getAddressBalance(ADDRESS)).resolves.toEqual({
            address: ADDRESS,
            balanceSat: 125000,
            confirmedSat: 120000,
            mempoolSat: 5000,
        });
    });

    test('throws ExternalServiceError when the request fails', async () => {
        const get = jest.fn().mockRejectedValue(new Error('500'));
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getAddressBalance(ADDRESS)).rejects.toBeInstanceOf(ExternalServiceError);
    });

    test('throws ExternalServiceError when the payload is malformed', async () => {
        const get = jest.fn().mockResolvedValue({ data: { chain_stats: {} } });
        const client = createBlockchainClient(mockHttp(get), BASE_URL);

        await expect(client.getAddressBalance(ADDRESS)).rejects.toBeInstanceOf(ExternalServiceError);
    });
});