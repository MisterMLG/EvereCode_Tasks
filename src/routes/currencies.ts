import express, { type Router } from 'express';
import type { CurrencyRepository } from '../repositories/currencyRepository';
import type { Currency } from '../types/domain';

const TICKER_PATTERN = /^[A-Z0-9]{2,20}$/;

function normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
}

type ParseResult = { error: string } | { currency: Currency };

function parseCurrency(body: unknown): ParseResult {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const { name, ticker } = body as Record<string, unknown>;

    if (typeof name !== 'string' || !name.trim()) {
        return { error: 'Currency name is required' };
    }

    if (typeof ticker !== 'string' || !ticker.trim()) {
        return { error: 'Currency ticker is required' };
    }

    const normalizedTicker = normalizeTicker(ticker);

    if (!TICKER_PATTERN.test(normalizedTicker)) {
        return { error: 'Currency ticker must contain 2-20 letters or numbers' };
    }

    return {
        currency: {
            name: name.trim(),
            ticker: normalizedTicker,
        },
    };
}

export function createCurrenciesRouter(currencyRepository: CurrencyRepository): Router {
    const router = express.Router();

    router.get('/', (_req, res) => {
        res.json(currencyRepository.list());
    });

    router.post('/', (req, res) => {
        const result = parseCurrency(req.body);

        if ('error' in result) {
            res.status(400).json({ error: result.error });
            return;
        }

        const createdCurrency = currencyRepository.create(result.currency);

        if (!createdCurrency) {
            res.status(409).json({ error: 'Currency already exists' });
            return;
        }

        res.status(201).json(createdCurrency);
    });

    router.get('/:ticker', (req, res) => {
        const currency = currencyRepository.get(req.params.ticker);

        if (!currency) {
            res.status(404).json({ error: 'Currency not found' });
            return;
        }

        res.json(currency);
    });

    router.put('/:ticker', (req, res) => {
        const result = parseCurrency(req.body);

        if ('error' in result) {
            res.status(400).json({ error: result.error });
            return;
        }

        const ticker = normalizeTicker(req.params.ticker);

        if (result.currency.ticker !== ticker) {
            res.status(400).json({ error: 'Ticker in URL and body must match' });
            return;
        }

        const updatedCurrency = currencyRepository.update(ticker, result.currency);

        if (!updatedCurrency) {
            res.status(404).json({ error: 'Currency not found' });
            return;
        }

        res.json(updatedCurrency);
    });

    router.delete('/:ticker', (req, res) => {
        const deleted = currencyRepository.remove(req.params.ticker);

        if (!deleted) {
            res.status(404).json({ error: 'Currency not found' });
            return;
        }

        res.status(204).send();
    });

    return router;
}

export default createCurrenciesRouter;