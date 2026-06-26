import fs from 'fs';
import os from 'os';
import path from 'path';
import { createDatabase, type Database } from '../src/db/database';
import { initializeDatabase } from '../src/db/schema';
import { createCurrencyRepository, type CurrencyRepository } from '../src/repositories/currencyRepository';

describe('currencyRepository', () => {
    let tempDir: string;
    let databasePath: string;
    let database: Database;
    let repository: CurrencyRepository;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crypto-tracker-'));
        databasePath = path.join(tempDir, 'test.sqlite');
        database = createDatabase(databasePath);
        initializeDatabase(database);
        repository = createCurrencyRepository(database);
    });

    afterEach(() => {
        database.close();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('performs CRUD operations through SQLite', () => {
        expect(repository.list()).toEqual([]);

        expect(repository.create({ name: 'Bitcoin', ticker: 'btc' })).toEqual({
            name: 'Bitcoin',
            ticker: 'BTC',
        });
        expect(repository.create({ name: 'Bitcoin Duplicate', ticker: 'BTC' })).toBeNull();
        expect(repository.get('btc')).toEqual({ name: 'Bitcoin', ticker: 'BTC' });
        expect(repository.has('BTC')).toBe(true);

        expect(repository.update('btc', { name: 'Bitcoin Updated', ticker: 'BTC' })).toEqual({
            name: 'Bitcoin Updated',
            ticker: 'BTC',
        });
        expect(repository.list()).toEqual([{ name: 'Bitcoin Updated', ticker: 'BTC' }]);

        expect(repository.remove('btc')).toBe(true);
        expect(repository.remove('btc')).toBe(false);
        expect(repository.get('btc')).toBeNull();
    });

    test('persists currencies in a database file', () => {
        repository.create({ name: 'Ethereum', ticker: 'ETH' });
        database.close();

        database = createDatabase(databasePath);
        initializeDatabase(database);
        repository = createCurrencyRepository(database);

        expect(repository.get('eth')).toEqual({ name: 'Ethereum', ticker: 'ETH' });
    });

    test('stores SQL-looking input as plain data (no injection)', () => {
        const maliciousName = "Bitcoin'); DROP TABLE currencies; --";

        expect(repository.create({ name: maliciousName, ticker: 'BTC' })).toEqual({
            name: maliciousName,
            ticker: 'BTC',
        });
        expect(repository.create({ name: 'Ethereum', ticker: 'ETH' })).toEqual({
            name: 'Ethereum',
            ticker: 'ETH',
        });
        expect(repository.list()).toEqual([
            { name: maliciousName, ticker: 'BTC' },
            { name: 'Ethereum', ticker: 'ETH' },
        ]);
    });
});