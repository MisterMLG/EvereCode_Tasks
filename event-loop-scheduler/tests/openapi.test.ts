import request from 'supertest';
import { buildServer } from './testServer';

describe('GET /openapi.json', () => {
    test('returns the OpenAPI specification covering every endpoint', async () => {
        const { app } = buildServer();

        const response = await request(app).get('/openapi.json');

        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.3');

        const paths = response.body.paths;
        expect(paths['/status']).toBeDefined();
        expect(paths['/currencies']).toBeDefined();
        expect(paths['/currencies/{ticker}']).toBeDefined();
        expect(paths['/price']).toBeDefined();
        expect(paths['/price/{ticker}/history']).toBeDefined();
        expect(paths['/addresses']).toBeDefined();
        expect(paths['/addresses/{address}']).toBeDefined();
        expect(paths['/addresses/{address}/balance']).toBeDefined();
        expect(paths['/blockchain/height']).toBeDefined();
    });
});