import type { AxiosInstance } from 'axios';
import { ExternalServiceError } from '../errors/errors';
import type { AddressBalance } from '../types/domain';

export interface BlockchainClient {
    getBlockHeight(): Promise<number>;
    getAddressBalance(address: string): Promise<AddressBalance>;
}

interface AddressStats {
    funded_txo_sum?: unknown;
    spent_txo_sum?: unknown;
}

interface RawAddress {
    chain_stats?: AddressStats;
    mempool_stats?: AddressStats;
}

function netSat(stats: AddressStats | undefined): number {
    const funded = Number(stats?.funded_txo_sum);
    const spent = Number(stats?.spent_txo_sum);

    if (!Number.isFinite(funded) || !Number.isFinite(spent)) {
        throw new ExternalServiceError('Unexpected address balance response');
    }

    return funded - spent;
}

export function createBlockchainClient(http: AxiosInstance, baseUrl: string): BlockchainClient {
    return {
        async getBlockHeight(): Promise<number> {
            let data: unknown;

            try {
                const response = await http.get(`${baseUrl}/blocks/tip/height`);
                data = response.data;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                throw new ExternalServiceError(`Block height request failed: ${message}`);
            }

            const height = Number(data);

            if (!Number.isInteger(height) || height < 0) {
                throw new ExternalServiceError('Unexpected block height response');
            }

            return height;
        },

        async getAddressBalance(address: string): Promise<AddressBalance> {
            let data: RawAddress;

            try {
                const response = await http.get(`${baseUrl}/address/${encodeURIComponent(address)}`);
                data = response.data as RawAddress;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                throw new ExternalServiceError(`Address balance request failed: ${message}`);
            }

            const confirmedSat = netSat(data?.chain_stats);
            const mempoolSat = netSat(data?.mempool_stats);

            return {
                address,
                confirmedSat,
                mempoolSat,
                balanceSat: confirmedSat + mempoolSat,
            };
        },
    };
}

export default createBlockchainClient;