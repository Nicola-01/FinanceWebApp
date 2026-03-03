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
    id: string,
    name: string,
    icon: string,
    color: string,
    currency: string,
    createdAt: string,
    myRole: 'OWNER' | 'EDITOR' | 'VIEWER',
    wallet?: Wallet
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
    exchangeValue?: number;
    type: 'INCOME' | 'EXPENSE';
    notes?: string;
    transactionDate: string;
}

export interface WalletMember {
    userId: string;
    username: string;
    email: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    status: 'ACTIVE' | 'PENDING';
    invitedAt: string;
}


export interface Invitation {
    username: string;
    role: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT' | 'REVOKED';
    invitedAt: string;
}