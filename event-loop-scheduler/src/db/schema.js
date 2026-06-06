const CURRENCY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS currencies (
    ticker TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS currency_prices (
    currency_ticker TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (currency_ticker, symbol),
    FOREIGN KEY (currency_ticker)
        REFERENCES currencies(ticker)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
`;

function initializeDatabase(database) {
    database.exec(CURRENCY_SCHEMA_SQL);
}

module.exports = {
    CURRENCY_SCHEMA_SQL,
    initializeDatabase
};