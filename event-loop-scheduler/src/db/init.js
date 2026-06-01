const config = require('../config/config');
const { createDatabase } = require('./database');
const { initializeDatabase } = require('./schema');

const database = createDatabase(config.databasePath);

initializeDatabase(database);
database.close();

console.log(`Database initialized at ${config.databasePath}`);