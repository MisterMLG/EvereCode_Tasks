const BINANCE_PRICES_URL = 'https://api.binance.com/api/v3/ticker/price';

function isPrice(value) {
    return value
        && typeof value.symbol === 'string'
        && value.symbol.length > 0
        && (typeof value.price === 'string' || typeof value.price === 'number');
}

function createPriceUpdater({
    currencyRepository,
    priceRepository,
    fetchImpl = global.fetch
}) {
    if (!fetchImpl) {
        throw new Error('fetch is not available');
    }

    let runningUpdate = null;

    async function performUpdate() {
        const currenciesBeforeRequest = currencyRepository.list();

        if (currenciesBeforeRequest.length === 0) {
            priceRepository.replaceAll([]);

            return {
                currencies: 0,
                prices: 0
            };
        }

        const response = await fetchImpl(BINANCE_PRICES_URL);

        if (!response.ok) {
            throw new Error(`Binance price request failed with status ${response.status}`);
        }

        const responseBody = await response.json();

        if (!Array.isArray(responseBody)) {
            throw new Error('Unexpected Binance price response');
        }

        const binancePrices = responseBody
            .filter(isPrice)
            .map((price) => ({
                symbol: price.symbol.toUpperCase(),
                price: String(price.price)
            }));

        const currencies = currencyRepository.list();
        const priceGroups = currencies.map(({ ticker }) => ({
            currency: ticker,
            prices: binancePrices.filter(({ symbol }) => symbol.includes(ticker))
        }));
        const savedPriceCount = priceRepository.replaceAll(priceGroups);

        return {
            currencies: currencies.length,
            prices: savedPriceCount
        };
    }

    return function updatePrices() {
        if (runningUpdate) {
            return runningUpdate;
        }

        runningUpdate = performUpdate().finally(() => {
            runningUpdate = null;
        });

        return runningUpdate;
    };
}

module.exports = {
    BINANCE_PRICES_URL,
    createPriceUpdater
};