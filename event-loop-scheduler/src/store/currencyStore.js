function normalizeTicker(ticker) {
    return ticker.trim().toUpperCase();
}

function createCurrencyStore() {
    const currencies = new Map();

    function list() {
        return Array.from(currencies.values());
    }

    function get(ticker) {
        return currencies.get(normalizeTicker(ticker)) || null;
    }

    function has(ticker) {
        return currencies.has(normalizeTicker(ticker));
    }

    function create(currency) {
        const ticker = normalizeTicker(currency.ticker);

        if (currencies.has(ticker)) {
            return null;
        }

        const createdCurrency = {
            name: currency.name.trim(),
            ticker
        };

        currencies.set(ticker, createdCurrency);

        return createdCurrency;
    }

    function update(ticker, currency) {
        const normalizedTicker = normalizeTicker(ticker);

        if (!currencies.has(normalizedTicker)) {
            return null;
        }

        const updatedCurrency = {
            name: currency.name.trim(),
            ticker: normalizedTicker
        };

        currencies.set(normalizedTicker, updatedCurrency);

        return updatedCurrency;
    }

    function remove(ticker) {
        return currencies.delete(normalizeTicker(ticker));
    }

    return {
        list,
        get,
        has,
        create,
        update,
        remove
    };
}

module.exports = createCurrencyStore;