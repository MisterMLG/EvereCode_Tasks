const { runInTransaction } = require('../db/transaction');

function normalizeTicker(ticker) {
    return ticker.trim().toUpperCase();
}

function toCurrency(row) {
    if (!row) {
        return null;
    }

    return {
        name: row.name,
        ticker: row.ticker
    };
}

function createCurrencyRepository(database) {
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
        `)
    };

    function list() {
        return statements.list.all().map(toCurrency);
    }

    function get(ticker) {
        return toCurrency(statements.get.get(normalizeTicker(ticker)));
    }

    function has(ticker) {
        return get(ticker) !== null;
    }

    function create(currency) {
        return runInTransaction(database, () => {
            const ticker = normalizeTicker(currency.ticker);
            const name = currency.name.trim();

            return toCurrency(statements.create.get(ticker, name));
        });
    }

    function update(ticker, currency) {
        return runInTransaction(database, () => {
            const normalizedTicker = normalizeTicker(ticker);
            const name = currency.name.trim();

            return toCurrency(statements.update.get(name, normalizedTicker));
        });
    }

    function remove(ticker) {
        return runInTransaction(database, () => {
            const result = statements.remove.run(normalizeTicker(ticker));

            return result.changes > 0;
        });
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

module.exports = createCurrencyRepository;