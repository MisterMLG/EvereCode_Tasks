const request = require('supertest');
const app = require('../src/server');

describe('GET /status', () => {
    test('returns ok', async () => {
        const response = await request(app).get('/status');

        expect(response.status).toBe(200);
        expect(response.text).toBe('ok');
    });
});