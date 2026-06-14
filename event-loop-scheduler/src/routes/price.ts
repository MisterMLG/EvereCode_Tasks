import express, { type Router } from 'express';
import type { CurrencyRepository } from '../repositories/currencyRepository';
import type { PriceRepository } from '../repositories/priceRepository';

export interface PriceRouterDeps {
    currencyRepository: CurrencyRepository;
    priceRepository: PriceRepository;
}

export function createPriceRouter({ currencyRepository, priceRepository }: PriceRouterDeps): Router {
    const router = express.Router();

    router.get('/', (req, res) => {
        const currency =
            typeof req.query.currency === 'string' ? req.query.currency.trim().toUpperCase() : '';

        if (!currency) {
            res.status(400).json({ error: 'currency query parameter is required' });
            return;
        }

        if (!currencyRepository.has(currency)) {
            res.status(404).json({ error: 'Currency not found' });
            return;
        }

        res.json({
            currency,
            prices: priceRepository.listByCurrency(currency),
        });
    });

    router.get('/:ticker/history', (req, res) => {
        const ticker = req.params.ticker.trim().toUpperCase();

        if (!currencyRepository.has(ticker)) {
            res.status(404).json({ error: 'Currency not found' });
            return;
        }

        let limit: number | undefined;

        if (req.query.limit !== undefined) {
            const parsed = Number(req.query.limit);

            if (!Number.isInteger(parsed) || parsed <= 0) {
                res.status(400).json({ error: 'limit must be a positive integer' });
                return;
            }

            limit = parsed;
        }

        const symbol =
            typeof req.query.symbol === 'string' && req.query.symbol.trim()
                ? req.query.symbol.trim().toUpperCase()
                : undefined;

        res.json({
            currency: ticker,
            symbol: symbol ?? null,
            history: priceRepository.listHistory(ticker, { symbol, limit }),
        });
    });

    return router;
}

export default createPriceRouter;