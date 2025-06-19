export interface BlockchainWallet {
    id: number;
    deviceId: string;
    ethereum_address: string;
    ethereum_public_key: string;
    ethereum_private_key: string;
    chain_type: string;
    createdAt: string;
}

export interface BlockchainParams {
    chain_type: string;
    rpc_url: string;
    network_id: number;
}

export interface WasmModule {
    generate_wallet(mnemonic: string, chain_type: string): Promise<BlockchainWallet>;
    sign_message(private_key: string, message: string): Promise<{ signature: string; success: boolean; message: string }>;
    verify_signature(public_key: string, message: string, signature: string): Promise<{ signature: string; success: boolean; message: string }>;
}

declare module '*.wasm' {
    const content: any;
    export default content;
}

declare module '@/Wasm-Blockchain/wallet-wasm/pkg/wallet_wasm' {
    export interface WalletWasmModule {
        generate_wallet: (mnemonic: string, chainType: string) => Promise<{
            address: string;
            chain_type: string;
            public_key: string;
            private_key: string;
        }>;
    }

    export interface InitOutput {
        generate_wallet: WalletWasmModule['generate_wallet'];
    }

    export default function init(): Promise<InitOutput>;
} 