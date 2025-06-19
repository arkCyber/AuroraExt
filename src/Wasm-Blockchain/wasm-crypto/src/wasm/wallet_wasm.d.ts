declare module 'wallet-wasm/wallet_wasm' {
    export interface WalletResult {
        address: string;
        privateKey: string;
        publicKey: string;
        public_key?: string; // 兼容两种属性名
    }

    export function generate_wallet(mnemonic: string, chain_type: string): WalletResult;
    export function initSync(): void;
    export default function init(): Promise<void>;
} 