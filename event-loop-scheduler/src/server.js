const express = require('express');

const app = express();

app.get('/status', (req, res) => {
    res.send('ok');
});

module.exports = app;