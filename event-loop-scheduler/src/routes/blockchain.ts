import express, { type Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { BlockchainClient } from '../services/blockchainClient';

export interface BlockchainRouterDeps {
    blockchainClient: BlockchainClient;
}

export function createBlockchainRouter({ blockchainClient }: BlockchainRouterDeps): Router {
    const router = express.Router();

    router.get(
        '/height',
        asyncHandler(async (_req, res) => {
            const height = await blockchainClient.getBlockHeight();

            res.json({ height });
        }),
    );

    return router;
}

export default createBlockchainRouter;