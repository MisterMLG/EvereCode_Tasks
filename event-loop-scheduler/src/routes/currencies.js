const express = require('express');

const TICKER_PATTERN = /^[A-Z0-9]{2,20}$/;

function normalizeTicker(ticker) {
    return ticker.trim().toUpperCase();
}

function parseCurrency(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    if (typeof body.name !== 'string' || !body.name.trim()) {
        return { error: 'Currency name is required' };
    }

    if (typeof body.ticker !== 'string' || !body.ticker.trim()) {
        return { error: 'Currency ticker is required' };
    }

    const ticker = normalizeTicker(body.ticker);

    if (!TICKER_PATTERN.test(ticker)) {
        return { error: 'Currency ticker must contain 2-20 letters or numbers' };
    }

    return {
        currency: {
            name: body.name.trim(),
            ticker
        }
    };
}

function createCurrenciesRouter(currencyRepository) {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.json(currencyRepository.list());
    });

    router.post('/', (req, res) => {
        const result = parseCurrency(req.body);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        const createdCurrency = currencyRepository.create(result.currency);

        if (!createdCurrency) {
            return res.status(409).json({ error: 'Currency already exists' });
        }

        return res.status(201).json(createdCurrency);
    });

    router.get('/:ticker', (req, res) => {
        const currency = currencyRepository.get(req.params.ticker);

        if (!currency) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        return res.json(currency);
    });

    router.put('/:ticker', (req, res) => {
        const result = parseCurrency(req.body);

        if (result.error) {
            return res.status(400).json({ error: result.error });
        }

        const ticker = normalizeTicker(req.params.ticker);

        if (result.currency.ticker !== ticker) {
            return res.status(400).json({ error: 'Ticker in URL and body must match' });
        }

        const updatedCurrency = currencyRepository.update(ticker, result.currency);

        if (!updatedCurrency) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        return res.json(updatedCurrency);
    });

    router.delete('/:ticker', (req, res) => {
        const deleted = currencyRepository.remove(req.params.ticker);

        if (!deleted) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        return res.status(204).send();
    });

    return router;
}

module.exports = createCurrenciesRouter;