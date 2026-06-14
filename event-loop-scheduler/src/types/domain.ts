export interface Currency {
    name: string;
    ticker: string;
}

export interface Price {
    symbol: string;
    price: string;
}

export interface PriceGroup {
    currency: string;
    prices: Price[];
}

export interface PriceHistoryEntry {
    symbol: string;
    price: string;
    recordedAt: string;
}

export interface Address {
    address: string;
    label: string | null;
}

export interface AddressBalance {
    address: string;
    balanceSat: number;
    confirmedSat: number;
    mempoolSat: number;
}