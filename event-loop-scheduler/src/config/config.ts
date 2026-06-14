import 'dotenv/config';
import path from 'path';
import type { LogLevel } from '../logger/logger';

export interface AppConfig {
    appName: string;
    logLevel: LogLevel;
    port: number;
    authToken: string | undefined;
    databasePath: string;
    http: {
        timeoutMs: number;
        retries: number;
        retryDelayMs: number;
    };
    binance: {
        baseUrl: string;
    };
    blockchain: {
        baseUrl: string;
    };
    scheduler: {
        taskName: string;
        interval: number;
    };
}

const config: AppConfig = {
    appName: 'Crypto Tracker API',
    logLevel: 'info',
    port: Number(process.env.PORT) || 3000,
    authToken: process.env.AUTH_TOKEN,
    databasePath:
        process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'app.sqlite'),
    http: {
        timeoutMs: Number(process.env.HTTP_TIMEOUT_MS) || 5000,
        retries: Number(process.env.HTTP_RETRIES) || 2,
        retryDelayMs: Number(process.env.HTTP_RETRY_DELAY_MS) || 300,
    },
    binance: {
        baseUrl: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
    },
    blockchain: {
        baseUrl: process.env.BLOCKSTREAM_BASE_URL || 'https://blockstream.info/api',
    },
    scheduler: {
        taskName: 'price-update',
        interval: 60_000,
    },
};

export default config;