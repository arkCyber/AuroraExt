export interface BlockchainParams {
    chainType: string;
    mnemonic: string;
    timestamp: number;
    address: string;
    public_key: string;
    networkId: number;
    rpcUrl: string;
}

declare module '@/Wasm-Blockchain/wallet-wasm/pkg/wallet_wasm' {
    export interface WalletResult {
        address: string;
        chain_type: string;
        public_key: string;
        private_key: string;
    }

    export function generate_wallet(mnemonic: string, chain_type: string): Promise<WalletResult>;
    export function initSync(): void;

    export interface InitOutput {
        generate_wallet: typeof generate_wallet;
        initSync: typeof initSync;
    }

    export default function init(): Promise<InitOutput>;
}

export interface WasmModule {
    generateBlockchainParams: (mnemonic: string, chainType: string) => BlockchainParams;
    validateMnemonic: (mnemonic: string) => boolean;
    generateAddress: (mnemonic: string, chainType: string) => string;
    generatePublicKey: (mnemonic: string, chainType: string) => string;
} 