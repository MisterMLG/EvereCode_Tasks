import request from 'supertest';
import { buildServer, VALID_TOKEN, INVALID_TOKEN } from './testServer';

describe('GET /status', () => {
    const { app } = buildServer();

    test('returns ok when authorization token is valid', async () => {
        const response = await request(app)
            .get('/status')
            .set('Authorization', `Bearer ${VALID_TOKEN}`);

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
            .set('Authorization', `Bearer ${INVALID_TOKEN}`);

        expect(response.status).toBe(403);
        expect(response.text).toBe('Forbidden');
    });
});