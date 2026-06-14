import type { AxiosInstance } from 'axios';
import { createBinanceClient } from '../src/services/binanceClient';
import { ExternalServiceError } from '../src/errors/errors';

const BASE_URL = 'https://api.binance.com';

function mockHttp(get: jest.Mock): AxiosInstance {
    return { get } as unknown as AxiosInstance;
}

describe('binanceClient', () => {
    test('returns normalised ticker prices and ignores malformed entries', async () => {
        const get = jest.fn().mockResolvedValue({
            data: [
                { symbol: 'btcusdt', price: '65000.00000000' },
                { symbol: 'ETHUSDT', price: 3000 },
                { symbol: '', price: '1' },
                { price: '1' },
            ],
        });
        const client = createBinanceClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).resolves.toEqual([
            { symbol: 'BTCUSDT', price: '65000.00000000' },
            { symbol: 'ETHUSDT', price: '3000' },
        ]);
        expect(get).toHaveBeenCalledWith(`${BASE_URL}/api/v3/ticker/price`);
    });

    test('throws ExternalServiceError when the request fails', async () => {
        const get = jest.fn().mockRejectedValue(new Error('ECONNABORTED'));
        const client = createBinanceClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).rejects.toBeInstanceOf(ExternalServiceError);
    });

    test('throws ExternalServiceError when the payload is not an array', async () => {
        const get = jest.fn().mockResolvedValue({ data: { error: 'nope' } });
        const client = createBinanceClient(mockHttp(get), BASE_URL);

        await expect(client.getAllPrices()).rejects.toBeInstanceOf(ExternalServiceError);
    });
});