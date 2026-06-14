import { runInTransaction } from '../db/transaction';
import type { Database } from '../db/database';
import type { Currency } from '../types/domain';

interface CurrencyRow {
    name: string;
    ticker: string;
}

export interface CurrencyRepository {
    list(): Currency[];
    get(ticker: string): Currency | null;
    has(ticker: string): boolean;
    create(currency: Currency): Currency | null;
    update(ticker: string, currency: Currency): Currency | null;
    remove(ticker: string): boolean;
}

function normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase();
}

function toCurrency(row: CurrencyRow | undefined): Currency | null {
    if (!row) {
        return null;
    }

    return {
        name: row.name,
        ticker: row.ticker,
    };
}

export function createCurrencyRepository(database: Database): CurrencyRepository {
    const statements = {
        list: database.prepare(`
            SELECT name, ticker
            FROM currencies
            ORDER BY ticker
        `),
        get: database.prepare(`
            SELECT name, ticker
            FROM currencies
            WHERE ticker = ?
        `),
        create: database.prepare(`
            INSERT INTO currencies (ticker, name)
            VALUES (?, ?)
            ON CONFLICT(ticker) DO NOTHING
            RETURNING name, ticker
        `),
        update: database.prepare(`
            UPDATE currencies
            SET name = ?,
                updated_at = datetime('now')
            WHERE ticker = ?
            RETURNING name, ticker
        `),
        remove: database.prepare(`
            DELETE FROM currencies
            WHERE ticker = ?
        `),
    };

    function list(): Currency[] {
        return (statements.list.all() as unknown as CurrencyRow[]).map((row) => ({
            name: row.name,
            ticker: row.ticker,
        }));
    }

    function get(ticker: string): Currency | null {
        return toCurrency(statements.get.get(normalizeTicker(ticker)) as unknown as CurrencyRow | undefined);
    }

    function has(ticker: string): boolean {
        return get(ticker) !== null;
    }

    function create(currency: Currency): Currency | null {
        return runInTransaction(database, () => {
            const ticker = normalizeTicker(currency.ticker);
            const name = currency.name.trim();

            return toCurrency(statements.create.get(ticker, name) as unknown as CurrencyRow | undefined);
        });
    }

    function update(ticker: string, currency: Currency): Currency | null {
        return runInTransaction(database, () => {
            const normalizedTicker = normalizeTicker(ticker);
            const name = currency.name.trim();

            return toCurrency(
                statements.update.get(name, normalizedTicker) as unknown as CurrencyRow | undefined,
            );
        });
    }

    function remove(ticker: string): boolean {
        return runInTransaction(database, () => {
            const result = statements.remove.run(normalizeTicker(ticker));

            return Number(result.changes) > 0;
        });
    }

    return {
        list,
        get,
        has,
        create,
        update,
        remove,
    };
}

export default createCurrencyRepository;