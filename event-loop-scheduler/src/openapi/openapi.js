const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Event Loop Scheduler API',
        version: '1.0.0'
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer'
            }
        },
        schemas: {
            Currency: {
                type: 'object',
                required: ['name', 'ticker'],
                properties: {
                    name: { type: 'string', example: 'Bitcoin' },
                    ticker: { type: 'string', example: 'BTC' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' }
                }
            },
            Price: {
                type: 'object',
                properties: {
                    symbol: { type: 'string', example: 'BTCUSDT' },
                    price: { type: 'string', example: '65000.00000000' }
                }
            },
            PriceResponse: {
                type: 'object',
                properties: {
                    currency: { type: 'string', example: 'BTC' },
                    prices: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Price' }
                    }
                }
            }
        }
    },
    paths: {
        '/openapi.json': {
            get: {
                summary: 'Get OpenAPI specification',
                responses: {
                    200: {
                        description: 'OpenAPI specification'
                    }
                }
            }
        },
        '/status': {
            get: {
                summary: 'Health check',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Server is running',
                        content: {
                            'text/plain': {
                                schema: { type: 'string', example: 'ok' }
                            }
                        }
                    },
                    401: { description: 'Authorization header is missing' },
                    403: { description: 'Authorization token is invalid' }
                }
            }
        },
        '/currencies': {
            get: {
                summary: 'List currencies',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Currency list',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Currency' }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Create currency',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Currency' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Currency created' },
                    400: { description: 'Invalid request body' },
                    409: { description: 'Currency already exists' }
                }
            }
        },
        '/currencies/{ticker}': {
            get: {
                summary: 'Get currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'ticker',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', example: 'BTC' }
                    }
                ],
                responses: {
                    200: { description: 'Currency found' },
                    404: { description: 'Currency not found' }
                }
            },
            put: {
                summary: 'Update currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'ticker',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', example: 'BTC' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Currency' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Currency updated' },
                    400: { description: 'Invalid request body' },
                    404: { description: 'Currency not found' }
                }
            },
            delete: {
                summary: 'Delete currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'ticker',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', example: 'BTC' }
                    }
                ],
                responses: {
                    204: { description: 'Currency deleted' },
                    404: { description: 'Currency not found' }
                }
            }
        },
        '/price': {
            get: {
                summary: 'Get saved prices containing currency ticker',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'currency',
                        in: 'query',
                        required: true,
                        schema: { type: 'string', example: 'BTC' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Prices saved by the background Binance updater',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PriceResponse' }
                            }
                        }
                    },
                    400: { description: 'currency query parameter is required' },
                    404: { description: 'Currency not found in database' }
                }
            }
        }
    }
};

module.exports = openApiSpec;