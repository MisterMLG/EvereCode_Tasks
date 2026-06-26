import { runInTransaction } from '../db/transaction';
import type { Database } from '../db/database';
import type { Price, PriceGroup, PriceHistoryEntry } from '../types/domain';

interface PriceRow {
    symbol: string;
    price: string;
}

interface HistoryRow {
    symbol: string;
    price: string;
    recordedAt: string;
}

export interface PriceHistoryQuery {
    symbol?: string;
    limit?: number;
}

export interface PriceRepository {
    listByCurrency(ticker: string): Price[];
    replaceAll(priceGroups: PriceGroup[]): number;
    appendHistory(priceGroups: PriceGroup[]): number;
    listHistory(ticker: string, query?: PriceHistoryQuery): PriceHistoryEntry[];
}

const HISTORY_DEFAULT_LIMIT = 100;
const HISTORY_MAX_LIMIT = 1000;

function normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
}

function clampLimit(limit: number | undefined): number {
    if (!Number.isInteger(limit) || (limit as number) <= 0) {
        return HISTORY_DEFAULT_LIMIT;
    }

    return Math.min(limit as number, HISTORY_MAX_LIMIT);
}

export function createPriceRepository(database: Database): PriceRepository {
    const statements = {
        listByCurrency: database.prepare(`
            SELECT symbol, price
            FROM currency_prices
            WHERE currency_ticker = ?
            ORDER BY symbol
        `),
        removeAll: database.prepare(`
            DELETE FROM currency_prices
        `),
        insert: database.prepare(`
            INSERT INTO currency_prices (currency_ticker, symbol, price)
            VALUES (?, ?, ?)
        `),
        insertHistory: database.prepare(`
            INSERT INTO price_history (currency_ticker, symbol, price)
            VALUES (?, ?, ?)
        `),
        listHistory: database.prepare(`
            SELECT symbol, price, recorded_at AS recordedAt
            FROM price_history
            WHERE currency_ticker = ?
            ORDER BY recorded_at DESC, id DESC
            LIMIT ?
        `),
        listHistoryBySymbol: database.prepare(`
            SELECT symbol, price, recorded_at AS recordedAt
            FROM price_history
            WHERE currency_ticker = ? AND symbol = ?
            ORDER BY recorded_at DESC, id DESC
            LIMIT ?
        `),
    };

    function listByCurrency(ticker: string): Price[] {
        return (statements.listByCurrency.all(normalizeTicker(ticker)) as unknown as PriceRow[]).map(
            (row) => ({
                symbol: row.symbol,
                price: row.price,
            }),
        );
    }

    function replaceAll(priceGroups: PriceGroup[]): number {
        return runInTransaction(database, () => {
            statements.removeAll.run();

            let savedPriceCount = 0;

            for (const group of priceGroups) {
                const ticker = normalizeTicker(group.currency);

                for (const price of group.prices) {
                    statements.insert.run(ticker, price.symbol, price.price);
                    savedPriceCount += 1;
                }
            }

            return savedPriceCount;
        });
    }

    function appendHistory(priceGroups: PriceGroup[]): number {
        return runInTransaction(database, () => {
            let savedPriceCount = 0;

            for (const group of priceGroups) {
                const ticker = normalizeTicker(group.currency);

                for (const price of group.prices) {
                    statements.insertHistory.run(ticker, price.symbol, price.price);
                    savedPriceCount += 1;
                }
            }

            return savedPriceCount;
        });
    }

    function listHistory(ticker: string, query: PriceHistoryQuery = {}): PriceHistoryEntry[] {
        const normalizedTicker = normalizeTicker(ticker);
        const limit = clampLimit(query.limit);

        const rows = query.symbol
            ? statements.listHistoryBySymbol.all(
                  normalizedTicker,
                  query.symbol.trim().toUpperCase(),
                  limit,
              )
            : statements.listHistory.all(normalizedTicker, limit);

        return (rows as unknown as HistoryRow[]).map((row) => ({
            symbol: row.symbol,
            price: row.price,
            recordedAt: row.recordedAt,
        }));
    }

    return {
        listByCurrency,
        replaceAll,
        appendHistory,
        listHistory,
    };
}

export default createPriceRepository;
