const express = require('express');

const BINANCE_PRICES_URL = 'https://api.binance.com/api/v3/ticker/price';

function createPriceRouter({ currencyStore, fetchImpl = global.fetch }) {
    const router = express.Router();

    if (!fetchImpl) {
        throw new Error('fetch is not available');
    }

    router.get('/', async (req, res) => {
        const currency = typeof req.query.currency === 'string'
            ? req.query.currency.trim().toUpperCase()
            : '';

        if (!currency) {
            return res.status(400).json({ error: 'currency query parameter is required' });
        }

        if (!currencyStore.has(currency)) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        try {
            const response = await fetchImpl(BINANCE_PRICES_URL);

            if (!response.ok) {
                return res.status(502).json({ error: 'Failed to fetch prices from Binance' });
            }

            const prices = await response.json();

            if (!Array.isArray(prices)) {
                return res.status(502).json({ error: 'Unexpected Binance response' });
            }

            return res.json({
                currency,
                prices: prices.filter((price) => (
                    typeof price.symbol === 'string' && price.symbol.includes(currency)
                ))
            });
        } catch (error) {
            return res.status(502).json({ error: 'Failed to fetch prices from Binance' });
        }
    });

    return router;
}

module.exports = createPriceRouter;