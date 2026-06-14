import express, { type Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AddressRepository } from '../repositories/addressRepository';
import type { BlockchainClient } from '../services/blockchainClient';

const ADDRESS_PATTERN = /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,39})$/;

function isValidAddress(address: string): boolean {
    return ADDRESS_PATTERN.test(address);
}

function singleParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    return value ?? '';
}

type LabelResult = { error: string } | { label: string | null };

function parseLabel(body: unknown): LabelResult {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const { label } = body as Record<string, unknown>;

    if (label === undefined || label === null) {
        return { label: null };
    }

    if (typeof label !== 'string') {
        return { error: 'Address label must be a string' };
    }

    const trimmed = label.trim();

    return { label: trimmed.length > 0 ? trimmed : null };
}

export interface AddressesRouterDeps {
    addressRepository: AddressRepository;
    blockchainClient: BlockchainClient;
}

export function createAddressesRouter({
    addressRepository,
    blockchainClient,
}: AddressesRouterDeps): Router {
    const router = express.Router();

    router.get('/', (_req, res) => {
        res.json(addressRepository.list());
    });

    router.post('/', (req, res) => {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            res.status(400).json({ error: 'Request body must be an object' });
            return;
        }

        const { address } = req.body as Record<string, unknown>;

        if (typeof address !== 'string' || !isValidAddress(address.trim())) {
            res.status(400).json({ error: 'A valid Bitcoin address is required' });
            return;
        }

        const labelResult = parseLabel(req.body);

        if ('error' in labelResult) {
            res.status(400).json({ error: labelResult.error });
            return;
        }

        const created = addressRepository.create({
            address: address.trim(),
            label: labelResult.label,
        });

        if (!created) {
            res.status(409).json({ error: 'Address already exists' });
            return;
        }

        res.status(201).json(created);
    });

    router.get('/:address', (req, res) => {
        const address = addressRepository.get(req.params.address);

        if (!address) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        res.json(address);
    });

    router.put('/:address', (req, res) => {
        const labelResult = parseLabel(req.body);

        if ('error' in labelResult) {
            res.status(400).json({ error: labelResult.error });
            return;
        }

        const updated = addressRepository.update(req.params.address, labelResult.label);

        if (!updated) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        res.json(updated);
    });

    router.delete('/:address', (req, res) => {
        const deleted = addressRepository.remove(req.params.address);

        if (!deleted) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        res.status(204).send();
    });

    router.get(
        '/:address/balance',
        asyncHandler(async (req, res) => {
            const address = singleParam(req.params.address);

            if (!isValidAddress(address)) {
                res.status(400).json({ error: 'A valid Bitcoin address is required' });
                return;
            }

            if (!addressRepository.has(address)) {
                res.status(404).json({ error: 'Address not found' });
                return;
            }

            const balance = await blockchainClient.getAddressBalance(address);

            res.json(balance);
        }),
    );

    return router;
}

export default createAddressesRouter;