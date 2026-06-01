const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function ensureDatabaseDirectory(databasePath) {
    if (databasePath === ':memory:') {
        return;
    }

    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

function createDatabase(databasePath) {
    ensureDatabaseDirectory(databasePath);

    const database = new DatabaseSync(databasePath);
    database.exec('PRAGMA foreign_keys = ON');

    return database;
}

module.exports = {
    createDatabase
};