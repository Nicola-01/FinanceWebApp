// src/types/types.ts

export interface User {
    id: string;
    name: string;
    token: string;

    createdAt?: string
    wallets?: number
    transactions?: number
}

export interface Wallet {
    id: string;
    name: string;
    icon: string;
    color: string;
    currency: string;
    createdAt: string;
    myRole: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface Tag {
    id?: string;
    name: string;
    icon: string;
    colorHex: string;
    parentName?: string | null;
}

export interface Transaction {
    id: string;
    name: string;
    tag: Tag;
    amount: number;
    originalAmount?: number;
    originalCurrency?: string;
    exchangeVale?: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    notes?: string;
    transactionDate: string;
}