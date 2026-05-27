const request = require('supertest');
const createServer = require('../src/server');

describe('GET /openapi.json', () => {
    test('returns OpenAPI specification for project endpoints', async () => {
        const app = createServer({
            authToken: 'a'.repeat(64),
            fetchImpl: jest.fn()
        });

        const response = await request(app).get('/openapi.json');

        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.3');
        expect(response.body.paths['/status']).toBeDefined();
        expect(response.body.paths['/currencies']).toBeDefined();
        expect(response.body.paths['/currencies/{ticker}']).toBeDefined();
        expect(response.body.paths['/price']).toBeDefined();
    });
});