import type { CurrencyRepository } from '../repositories/currencyRepository';
import type { PriceRepository } from '../repositories/priceRepository';
import type { BinanceClient } from './binanceClient';

export interface PriceUpdateResult {
    currencies: number;
    prices: number;
}

export interface PriceUpdaterDeps {
    currencyRepository: CurrencyRepository;
    priceRepository: PriceRepository;
    binanceClient: BinanceClient;
}

export type PriceUpdater = () => Promise<PriceUpdateResult>;

export function createPriceUpdater({
    currencyRepository,
    priceRepository,
    binanceClient,
}: PriceUpdaterDeps): PriceUpdater {
    let runningUpdate: Promise<PriceUpdateResult> | null = null;

    async function performUpdate(): Promise<PriceUpdateResult> {
        const currenciesBeforeRequest = currencyRepository.list();

        if (currenciesBeforeRequest.length === 0) {
            priceRepository.replaceAll([]);

            return { currencies: 0, prices: 0 };
        }

        const binancePrices = await binanceClient.getAllPrices();

        const currencies = currencyRepository.list();
        const priceGroups = currencies.map(({ ticker }) => ({
            currency: ticker,
            prices: binancePrices.filter(({ symbol }) => symbol.includes(ticker)),
        }));
        const savedPriceCount = priceRepository.replaceAll(priceGroups);
        priceRepository.appendHistory(priceGroups);

        return {
            currencies: currencies.length,
            prices: savedPriceCount,
        };
    }

    return function updatePrices(): Promise<PriceUpdateResult> {
        if (runningUpdate) {
            return runningUpdate;
        }

        runningUpdate = performUpdate().finally(() => {
            runningUpdate = null;
        });

        return runningUpdate;
    };
}

export default createPriceUpdater;