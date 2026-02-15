// src/types/index.ts

export interface User {
    username: string;
    token: string;
}

export interface Tag {
    name: string;
    icon: string;
    colorHex: string;
    parentName?: string | null;
}

export interface Wallet {
    id: string;
    name: string;
    icon: string;
    color: string;
    currency: string;
    createdAt: string;
    myRole: 'OWNER' | 'EDITOR' | 'VIEWER';
    // Nota: Il backend non invia il balance in WalletResponse.
    // Lo calcoleremo lato frontend sommando le transazioni o useremo un valore mock per la demo visuale.
    virtualBalance?: number;
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