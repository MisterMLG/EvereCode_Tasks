import axios, {
    AxiosError,
    type AxiosInstance,
    type InternalAxiosRequestConfig,
} from 'axios';

export interface HttpClientOptions {
    timeoutMs: number;
    retries?: number;
    retryDelayMs?: number;
}

type RetryConfig = InternalAxiosRequestConfig & { __retryCount?: number };

const RETRIABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function isRetriable(error: AxiosError): boolean {
    if (!error.response) {
        return true;
    }

    return RETRIABLE_STATUS.has(error.response.status);
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function createHttpClient(options: HttpClientOptions): AxiosInstance {
    const retries = options.retries ?? 0;
    const retryDelayMs = options.retryDelayMs ?? 300;

    const instance = axios.create({
        timeout: options.timeoutMs,
        headers: {
            Accept: 'application/json',
        },
    });

    instance.interceptors.response.use(undefined, async (error: AxiosError) => {
        const config = error.config as RetryConfig | undefined;

        if (!config || retries <= 0 || !isRetriable(error)) {
            return Promise.reject(error);
        }

        const attempt = (config.__retryCount ?? 0) + 1;

        if (attempt > retries) {
            return Promise.reject(error);
        }

        config.__retryCount = attempt;
        await delay(retryDelayMs * attempt);

        return instance.request(config);
    });

    return instance;
}
