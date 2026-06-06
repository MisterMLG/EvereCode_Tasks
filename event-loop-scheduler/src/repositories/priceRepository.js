const { runInTransaction } = require('../db/transaction');

function normalizeTicker(ticker) {
    return ticker.trim().toUpperCase();
}

function toPrice(row) {
    return {
        symbol: row.symbol,
        price: row.price
    };
}

function createPriceRepository(database) {
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
        `)
    };

    function listByCurrency(ticker) {
        return statements.listByCurrency
            .all(normalizeTicker(ticker))
            .map(toPrice);
    }

    function replaceAll(priceGroups) {
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

    return {
        listByCurrency,
        replaceAll
    };
}

module.exports = createPriceRepository;