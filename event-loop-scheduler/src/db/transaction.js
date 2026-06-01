function runInTransaction(database, operation) {
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

module.exports = {
    runInTransaction
};