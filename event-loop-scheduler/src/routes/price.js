const express = require('express');

function createPriceRouter({ currencyRepository, priceRepository }) {
    const router = express.Router();

    router.get('/', (req, res) => {
        const currency = typeof req.query.currency === 'string'
            ? req.query.currency.trim().toUpperCase()
            : '';

        if (!currency) {
            return res.status(400).json({ error: 'currency query parameter is required' });
        }

        if (!currencyRepository.has(currency)) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        return res.json({
            currency,
            prices: priceRepository.listByCurrency(currency)
        });
    });

    return router;
}

module.exports = createPriceRouter;