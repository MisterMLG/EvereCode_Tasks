const tickerParam = {
    name: 'ticker',
    in: 'path',
    required: true,
    schema: { type: 'string', example: 'BTC' },
};

const addressParam = {
    name: 'address',
    in: 'path',
    required: true,
    schema: { type: 'string', example: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' },
};

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Crypto Tracker API',
        version: '1.0.0',
        description:
            'REST API for tracking crypto currencies (Binance) and Bitcoin addresses (Blockstream).',
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
            },
        },
        schemas: {
            Currency: {
                type: 'object',
                required: ['name', 'ticker'],
                properties: {
                    name: { type: 'string', example: 'Bitcoin' },
                    ticker: { type: 'string', example: 'BTC' },
                },
            },
            Price: {
                type: 'object',
                properties: {
                    symbol: { type: 'string', example: 'BTCUSDT' },
                    price: { type: 'string', example: '65000.00000000' },
                },
            },
            PriceResponse: {
                type: 'object',
                properties: {
                    currency: { type: 'string', example: 'BTC' },
                    prices: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Price' },
                    },
                },
            },
            PriceHistoryEntry: {
                type: 'object',
                properties: {
                    symbol: { type: 'string', example: 'BTCUSDT' },
                    price: { type: 'string', example: '65000.00000000' },
                    recordedAt: { type: 'string', example: '2026-06-14 17:00:00' },
                },
            },
            PriceHistoryResponse: {
                type: 'object',
                properties: {
                    currency: { type: 'string', example: 'BTC' },
                    symbol: { type: 'string', nullable: true, example: 'BTCUSDT' },
                    history: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/PriceHistoryEntry' },
                    },
                },
            },
            Address: {
                type: 'object',
                required: ['address'],
                properties: {
                    address: {
                        type: 'string',
                        example: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
                    },
                    label: { type: 'string', nullable: true, example: 'Cold wallet' },
                },
            },
            AddressBalance: {
                type: 'object',
                properties: {
                    address: { type: 'string', example: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' },
                    balanceSat: { type: 'integer', example: 125000 },
                    confirmedSat: { type: 'integer', example: 120000 },
                    mempoolSat: { type: 'integer', example: 5000 },
                },
            },
            BlockHeight: {
                type: 'object',
                properties: {
                    height: { type: 'integer', example: 840000 },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string' },
                },
            },
        },
    },
    paths: {
        '/openapi.json': {
            get: {
                summary: 'Get OpenAPI specification',
                responses: {
                    200: { description: 'OpenAPI specification' },
                },
            },
        },
        '/status': {
            get: {
                summary: 'Health check',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Server is running',
                        content: {
                            'text/plain': { schema: { type: 'string', example: 'ok' } },
                        },
                    },
                    401: { description: 'Authorization header is missing' },
                    403: { description: 'Authorization token is invalid' },
                },
            },
        },
        '/currencies': {
            get: {
                summary: 'List tracked currencies',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Currency list',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Currency' },
                                },
                            },
                        },
                    },
                    401: { description: 'Unauthorized' },
                },
            },
            post: {
                summary: 'Create currency',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Currency' } },
                    },
                },
                responses: {
                    201: { description: 'Currency created' },
                    400: { description: 'Invalid request body' },
                    409: { description: 'Currency already exists' },
                },
            },
        },
        '/currencies/{ticker}': {
            get: {
                summary: 'Get currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [tickerParam],
                responses: {
                    200: { description: 'Currency found' },
                    404: { description: 'Currency not found' },
                },
            },
            put: {
                summary: 'Update currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [tickerParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Currency' } },
                    },
                },
                responses: {
                    200: { description: 'Currency updated' },
                    400: { description: 'Invalid request body' },
                    404: { description: 'Currency not found' },
                },
            },
            delete: {
                summary: 'Delete currency by ticker',
                security: [{ bearerAuth: [] }],
                parameters: [tickerParam],
                responses: {
                    204: { description: 'Currency deleted' },
                    404: { description: 'Currency not found' },
                },
            },
        },
        '/price': {
            get: {
                summary: 'Get saved prices for a currency',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'currency',
                        in: 'query',
                        required: true,
                        schema: { type: 'string', example: 'BTC' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Prices saved by the background Binance updater',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PriceResponse' },
                            },
                        },
                    },
                    400: { description: 'currency query parameter is required' },
                    404: { description: 'Currency not found in database' },
                },
            },
        },
        '/price/{ticker}/history': {
            get: {
                summary: 'Get recorded price history for a currency',
                security: [{ bearerAuth: [] }],
                parameters: [
                    tickerParam,
                    {
                        name: 'symbol',
                        in: 'query',
                        required: false,
                        schema: { type: 'string', example: 'BTCUSDT' },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        required: false,
                        schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
                    },
                ],
                responses: {
                    200: {
                        description: 'Price history collected by the background updater',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PriceHistoryResponse' },
                            },
                        },
                    },
                    400: { description: 'Invalid limit parameter' },
                    404: { description: 'Currency not found in database' },
                },
            },
        },
        '/addresses': {
            get: {
                summary: 'List tracked addresses',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Address list',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Address' },
                                },
                            },
                        },
                    },
                    401: { description: 'Unauthorized' },
                },
            },
            post: {
                summary: 'Track a new address',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': { schema: { $ref: '#/components/schemas/Address' } },
                    },
                },
                responses: {
                    201: { description: 'Address created' },
                    400: { description: 'Invalid Bitcoin address' },
                    409: { description: 'Address already exists' },
                },
            },
        },
        '/addresses/{address}': {
            get: {
                summary: 'Get tracked address',
                security: [{ bearerAuth: [] }],
                parameters: [addressParam],
                responses: {
                    200: { description: 'Address found' },
                    404: { description: 'Address not found' },
                },
            },
            put: {
                summary: 'Update address label',
                security: [{ bearerAuth: [] }],
                parameters: [addressParam],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { label: { type: 'string', nullable: true } },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Address updated' },
                    400: { description: 'Invalid request body' },
                    404: { description: 'Address not found' },
                },
            },
            delete: {
                summary: 'Stop tracking an address',
                security: [{ bearerAuth: [] }],
                parameters: [addressParam],
                responses: {
                    204: { description: 'Address deleted' },
                    404: { description: 'Address not found' },
                },
            },
        },
        '/addresses/{address}/balance': {
            get: {
                summary: 'Get current balance for a tracked address',
                security: [{ bearerAuth: [] }],
                parameters: [addressParam],
                responses: {
                    200: {
                        description: 'Address balance (satoshis) from Blockstream',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AddressBalance' },
                            },
                        },
                    },
                    400: { description: 'Invalid Bitcoin address' },
                    404: { description: 'Address not tracked' },
                    502: { description: 'Upstream blockchain provider error' },
                },
            },
        },
        '/blockchain/height': {
            get: {
                summary: 'Get current Bitcoin block height',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current block height from Blockstream',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/BlockHeight' },
                            },
                        },
                    },
                    401: { description: 'Unauthorized' },
                    502: { description: 'Upstream blockchain provider error' },
                },
            },
        },
    },
};

export default openApiSpec;