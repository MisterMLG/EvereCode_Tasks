const crypto = require('crypto');

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function getBearerToken(authHeader) {
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
}

function createAuthMiddleware(expectedToken) {
    if (!expectedToken || !TOKEN_PATTERN.test(expectedToken)) {
        throw new Error('AUTH_TOKEN must be a 64-character hex string');
    }

    return (req, res, next) => {
        const token = getBearerToken(req.get('authorization'));

        if (!token) {
            return res.status(401).send('Unauthorized');
        }

        if (!TOKEN_PATTERN.test(token)) {
            return res.status(403).send('Forbidden');
        }

        const expectedBuffer = Buffer.from(expectedToken, 'hex');
        const actualBuffer = Buffer.from(token, 'hex');

        if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
            return res.status(403).send('Forbidden');
        }

        return next();
    };
}

module.exports = createAuthMiddleware;