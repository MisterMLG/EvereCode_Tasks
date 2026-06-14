import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/errors';

interface JsonSyntaxError extends SyntaxError {
    status?: number;
    body?: unknown;
}

function isJsonBodyError(error: unknown): error is JsonSyntaxError {
    return (
        error instanceof SyntaxError &&
        (error as JsonSyntaxError).status === 400 &&
        'body' in error
    );
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (isJsonBodyError(error)) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: message });
};

export default errorHandler;