import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export type Database = DatabaseSync;

function ensureDatabaseDirectory(databasePath: string): void {
    if (databasePath === ':memory:') {
        return;
    }

    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

export function createDatabase(databasePath: string): Database {
    ensureDatabaseDirectory(databasePath);

    const database = new DatabaseSync(databasePath);
    database.exec('PRAGMA foreign_keys = ON');

    return database;
}