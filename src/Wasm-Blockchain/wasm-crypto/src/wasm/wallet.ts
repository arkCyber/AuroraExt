import init, { generate_wallet as generateWalletWasm } from 'wallet-wasm/wallet_wasm';

export interface WalletResult {
    address: string;
    privateKey: string;
    publicKey: string;
}

export async function initWasm() {
    await init();
}

export async function generate_wallet(mnemonic: string, chainType: string = 'ETH'): Promise<WalletResult> {
    try {
        const result = await generateWalletWasm(mnemonic, chainType);
        return {
            address: result.address,
            privateKey: result.privateKey,
            publicKey: result.publicKey || result.public_key || '' // 尝试两种可能的属性名
        };
    } catch (error) {
        console.error('Error in WASM wallet generation:', error);
        throw new Error(`Failed to generate wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 