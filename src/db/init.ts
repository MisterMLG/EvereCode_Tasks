import config from '../config/config';
import { createDatabase } from './database';
import { initializeDatabase } from './schema';

const database = createDatabase(config.databasePath);

initializeDatabase(database);
database.close();

console.log(`Database initialized at ${config.databasePath}`);