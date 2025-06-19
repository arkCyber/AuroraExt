import { WalletInfo } from '../utils/blockchain';

export interface UserInfo {
    id: string;
    nickname: string;
    avatar: string;
    deviceId: string;
    mnemonic: string;
    walletInfo: WalletInfo;
    createdAt: number;
    updatedAt: number;
} 