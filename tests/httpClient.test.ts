import http from 'http';
import type { AddressInfo } from 'net';
import { AxiosError } from 'axios';
import { createHttpClient } from '../src/services/httpClient';

interface TestServer {
    url: string;
    requestCount: () => number;
    close: () => Promise<void>;
}

async function startServer(handler: (attempt: number) => number): Promise<TestServer> {
    let attempts = 0;

    const server = http.createServer((_req, res) => {
        attempts += 1;
        const status = handler(attempts);
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ attempt: attempts, status }));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${port}`,
        requestCount: () => attempts,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
}

describe('createHttpClient retry behaviour', () => {
    let server: TestServer;

    afterEach(async () => {
        await server.close();
    });

    test('retries on 503 and resolves once the server recovers', async () => {
        server = await startServer((attempt) => (attempt < 3 ? 503 : 200));
        const client = createHttpClient({ timeoutMs: 1000, retries: 3, retryDelayMs: 10 });

        const response = await client.get(server.url);

        expect(response.status).toBe(200);
        expect(server.requestCount()).toBe(3);
    });

    test('gives up after exhausting retries', async () => {
        server = await startServer(() => 503);
        const client = createHttpClient({ timeoutMs: 1000, retries: 2, retryDelayMs: 10 });

        await expect(client.get(server.url)).rejects.toBeInstanceOf(AxiosError);
        expect(server.requestCount()).toBe(3);
    });

    test('does not retry on 4xx responses', async () => {
        server = await startServer(() => 400);
        const client = createHttpClient({ timeoutMs: 1000, retries: 3, retryDelayMs: 10 });

        await expect(client.get(server.url)).rejects.toBeInstanceOf(AxiosError);
        expect(server.requestCount()).toBe(1);
    });

    test('aborts slow requests once the timeout elapses', async () => {
        const slow = http.createServer(() => {
        });
        await new Promise<void>((resolve) => slow.listen(0, '127.0.0.1', resolve));
        const { port } = slow.address() as AddressInfo;
        const client = createHttpClient({ timeoutMs: 100, retries: 0 });

        await expect(client.get(`http://127.0.0.1:${port}`)).rejects.toMatchObject({
            code: 'ECONNABORTED',
        });

        await new Promise<void>((resolve) => slow.close(() => resolve()));
        server = { url: '', requestCount: () => 0, close: () => Promise.resolve() };
    });
});