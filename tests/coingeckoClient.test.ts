import type { AxiosInstance } from 'axios';
import { createCoingeckoClient } from '../src/services/coingeckoClient';
import { ExternalServiceError } from '../src/errors/errors';

const BASE_URL = 'https://api.coingecko.com';

function mockHttp(get: jest.Mock): AxiosInstance {
    return { get } as unknown as AxiosInstance;
}

describe('coingeckoClient', () => {
    test('returns normalised coin prices and ignores malformed entries', async () => {
        const get = jest.fn().mockResolvedValue({
            data: [
                { symbol: 'btc', current_price: 65000 },
                { symbol: 'eth', current_price: 3000.5 },
                { symbol: '', current_price: 1 },
                { current_price: 1 },
                { symbol: 'bad', current_price: NaN },
            ],
        });
        const client = createCoingeckoClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).resolves.toEqual([
            { symbol: 'BTCUSD', price: '65000' },
            { symbol: 'ETHUSD', price: '3000.5' },
        ]);
        expect(get).toHaveBeenCalledWith(`${BASE_URL}/api/v3/coins/markets`, {
            params: { vs_currency: 'usd', per_page: 250, page: 1 },
        });
    });

    test('throws ExternalServiceError when the request fails', async () => {
        const get = jest.fn().mockRejectedValue(new Error('ECONNABORTED'));
        const client = createCoingeckoClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).rejects.toBeInstanceOf(ExternalServiceError);
    });

    test('throws ExternalServiceError when the payload is not an array', async () => {
        const get = jest.fn().mockResolvedValue({ data: { error: 'nope' } });
        const client = createCoingeckoClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).rejects.toBeInstanceOf(ExternalServiceError);
    });
});
