import type { AxiosInstance } from 'axios';
import { ExternalServiceError } from '../errors/errors';
import type { Price } from '../types/domain';

const PRICES_PATH = '/api/v3/ticker/price';

export interface BinanceClient {
    getAllPrices(): Promise<Price[]>;
}

interface RawTicker {
    symbol?: unknown;
    price?: unknown;
}

function isTicker(value: RawTicker): value is { symbol: string; price: string | number } {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.symbol === 'string' &&
        value.symbol.length > 0 &&
        (typeof value.price === 'string' || typeof value.price === 'number')
    );
}

export function createBinanceClient(http: AxiosInstance, baseUrl: string): BinanceClient {
    return {
        async getAllPrices(): Promise<Price[]> {
            let data: unknown;

            try {
                const response = await http.get(`${baseUrl}${PRICES_PATH}`);
                data = response.data;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                throw new ExternalServiceError(`Binance price request failed: ${message}`);
            }

            if (!Array.isArray(data)) {
                throw new ExternalServiceError('Unexpected Binance price response');
            }

            return data.filter(isTicker).map((ticker) => ({
                symbol: ticker.symbol.toUpperCase(),
                price: String(ticker.price),
            }));
        },
    };
}

export default createBinanceClient;