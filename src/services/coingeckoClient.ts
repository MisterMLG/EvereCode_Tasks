import type { AxiosInstance } from 'axios';
import { ExternalServiceError } from '../errors/errors';
import type { Price } from '../types/domain';

const MARKETS_PATH = '/api/v3/coins/markets';

export interface CoingeckoClient {
    getAllPrices(): Promise<Price[]>;
}

interface RawCoin {
    symbol?: unknown;
    current_price?: unknown;
}

function isCoin(value: RawCoin): value is { symbol: string; current_price: number } {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.symbol === 'string' &&
        value.symbol.length > 0 &&
        typeof value.current_price === 'number' &&
        Number.isFinite(value.current_price)
    );
}

export function createCoingeckoClient(http: AxiosInstance, baseUrl: string): CoingeckoClient {
    return {
        async getAllPrices(): Promise<Price[]> {
            let data: unknown;

            try {
                const response = await http.get(`${baseUrl}${MARKETS_PATH}`, {
                    params: {
                        vs_currency: 'usd',
                        per_page: 250,
                        page: 1,
                    },
                });
                data = response.data;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                throw new ExternalServiceError(`CoinGecko price request failed: ${message}`);
            }

            if (!Array.isArray(data)) {
                throw new ExternalServiceError('Unexpected CoinGecko price response');
            }

            return data.filter(isCoin).map((coin) => ({
                symbol: `${coin.symbol.toUpperCase()}USD`,
                price: String(coin.current_price),
            }));
        },
    };
}

export default createCoingeckoClient;
