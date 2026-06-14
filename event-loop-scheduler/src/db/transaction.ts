import type { Database } from './database';

export function runInTransaction<T>(database: Database, operation: () => T): T {
    database.exec('BEGIN IMMEDIATE TRANSACTION');

    try {
        const result = operation();

        database.exec('COMMIT');

        return result;
    } catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
}