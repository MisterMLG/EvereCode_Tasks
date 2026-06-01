function errorHandler(error, req, res, next) {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    return next(error);
}

module.exports = errorHandler;