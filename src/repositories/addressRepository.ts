import { runInTransaction } from '../db/transaction';
import type { Database } from '../db/database';
import type { Address } from '../types/domain';

interface AddressRow {
    address: string;
    label: string | null;
}

export interface AddressRepository {
    list(): Address[];
    get(address: string): Address | null;
    has(address: string): boolean;
    create(address: Address): Address | null;
    update(address: string, label: string | null): Address | null;
    remove(address: string): boolean;
}

function toAddress(row: AddressRow | undefined): Address | null {
    if (!row) {
        return null;
    }

    return {
        address: row.address,
        label: row.label,
    };
}

export function createAddressRepository(database: Database): AddressRepository {
    const statements = {
        list: database.prepare(`
            SELECT address, label
            FROM addresses
            ORDER BY address
        `),
        get: database.prepare(`
            SELECT address, label
            FROM addresses
            WHERE address = ?
        `),
        create: database.prepare(`
            INSERT INTO addresses (address, label)
            VALUES (?, ?)
            ON CONFLICT(address) DO NOTHING
            RETURNING address, label
        `),
        update: database.prepare(`
            UPDATE addresses
            SET label = ?,
                updated_at = datetime('now')
            WHERE address = ?
            RETURNING address, label
        `),
        remove: database.prepare(`
            DELETE FROM addresses
            WHERE address = ?
        `),
    };

    function list(): Address[] {
        return (statements.list.all() as unknown as AddressRow[]).map((row) => ({
            address: row.address,
            label: row.label,
        }));
    }

    function get(address: string): Address | null {
        return toAddress(statements.get.get(address) as unknown as AddressRow | undefined);
    }

    function has(address: string): boolean {
        return get(address) !== null;
    }

    function create(address: Address): Address | null {
        return runInTransaction(database, () =>
            toAddress(statements.create.get(address.address, address.label) as unknown as AddressRow | undefined),
        );
    }

    function update(address: string, label: string | null): Address | null {
        return runInTransaction(database, () =>
            toAddress(statements.update.get(label, address) as unknown as AddressRow | undefined),
        );
    }

    function remove(address: string): boolean {
        return runInTransaction(database, () => {
            const result = statements.remove.run(address);

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

export default createAddressRepository;