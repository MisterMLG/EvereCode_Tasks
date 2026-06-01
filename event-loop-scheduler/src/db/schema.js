const CURRENCY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS currencies (
    ticker TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function initializeDatabase(database) {
    database.exec(CURRENCY_SCHEMA_SQL);
}

module.exports = {
    CURRENCY_SCHEMA_SQL,
    initializeDatabase
};