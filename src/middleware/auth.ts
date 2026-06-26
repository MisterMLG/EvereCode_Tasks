import crypto from 'crypto';
import type { RequestHandler } from 'express';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function getBearerToken(authHeader: string | undefined): string | null {
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
}

export function createAuthMiddleware(expectedToken: string | undefined): RequestHandler {
    if (!expectedToken || !TOKEN_PATTERN.test(expectedToken)) {
        throw new Error('AUTH_TOKEN must be a 64-character hex string');
    }

    const expectedBuffer = Buffer.from(expectedToken, 'hex');

    return (req, res, next) => {
        const token = getBearerToken(req.get('authorization'));

        if (!token) {
            res.status(401).send('Unauthorized');
            return;
        }

        if (!TOKEN_PATTERN.test(token)) {
            res.status(403).send('Forbidden');
            return;
        }

        const actualBuffer = Buffer.from(token, 'hex');

        if (
            actualBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
        ) {
            res.status(403).send('Forbidden');
            return;
        }

        next();
    };
}

export default createAuthMiddleware;