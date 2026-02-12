// src/types/index.ts

export interface User {
    username: string;
    token: string;
}

export interface AuthResponse {
    token: string;
}

export interface WalletRequest {
    name: string;
    currency: string;
    color: string;
    icon: string;
}

export interface Wallet {
    id: string; // UUID è una stringa in JS
    name: string;
    icon: string;
    color: string;
    currency: string;
    createdAt: string; // LocalDate diventa stringa ISO
    myRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'; // Enum mappato
}