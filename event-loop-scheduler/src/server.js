const express = require('express');
const createAuthMiddleware = require('./middleware/auth');

function createServer({ authToken }) {
    const app = express();
    const authMiddleware = createAuthMiddleware(authToken);

    app.get('/status', authMiddleware, (req, res) => {
        res.send('ok');
    });

    return app;
}

module.exports = createServer;
