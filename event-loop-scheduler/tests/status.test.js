const request = require('supertest');
const createServer = require('../src/server');

const validToken = 'a'.repeat(64);
const invalidToken = 'b'.repeat(64);

describe('GET /status', () => {
    const app = createServer({ authToken: validToken });

    test('returns ok when authorization token is valid', async () => {
        const response = await request(app)
            .get('/status')
            .set('Authorization', `Bearer ${validToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe('ok');
    });

    test('returns 401 when authorization header is missing', async () => {
        const response = await request(app).get('/status');

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('returns 403 when authorization token is invalid', async () => {
        const response = await request(app)
            .get('/status')
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(403);
        expect(response.text).toBe('Forbidden');
    });
});
