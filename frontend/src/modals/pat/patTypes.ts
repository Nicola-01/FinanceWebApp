export interface WalletPermissionDto {
    walletId: string;
    permissions: string[];
}

export interface PatToken {
    id: string;
    name: string;
    tokenPrefix: string;
    walletPermissions: WalletPermissionDto[];
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

export interface WalletPermState {
    walletId: string;
    walletName: string;
    walletIcon: string;
    walletColor: string;
    enabled: boolean;
    read: boolean;
    write: boolean;
}

export type ModalView = 'list' | 'create' | 'edit' | 'showToken';
