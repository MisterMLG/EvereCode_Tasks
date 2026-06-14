import type { Database } from './database';

export const SCHEMA_SQL = `
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

CREATE TABLE IF NOT EXISTS addresses (
    address TEXT PRIMARY KEY,
    label TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_ticker TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price TEXT NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (currency_ticker)
        REFERENCES currencies(ticker)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_history_lookup
    ON price_history (currency_ticker, symbol, recorded_at);
`;

export function initializeDatabase(database: Database): void {
    database.exec(SCHEMA_SQL);
}