import { generate_wallet } from '../wasm/wallet';
import { validateMnemonic } from './mnemonic';

export interface WalletInfo {
    address: string;
    private_key: string;
    public_key: string;
    chain_type: string;
}

export interface SignatureInfo {
    message: string;
    signature: string;
}

export async function generateWallet(mnemonic: string, chainType: string = 'ETH'): Promise<WalletInfo> {
    try {
        // 验证助记词
        const mnemonicValidation = validateMnemonic(mnemonic);
        if (!mnemonicValidation.isValid) {
            throw new Error(`Invalid mnemonic: ${mnemonicValidation.errors.join(', ')}`);
        }

        // 验证链类型
        if (!['ETH', 'BTC', 'SOL'].includes(chainType)) {
            throw new Error(`Unsupported chain type: ${chainType}`);
        }

        // 调用WASM生成钱包
        const wallet = await generate_wallet(mnemonic, chainType);

        // 验证返回值
        if (!wallet.address || !wallet.privateKey || !wallet.publicKey) {
            throw new Error('Invalid wallet data received from WASM');
        }

        // 验证地址格式
        if (!wallet.address.startsWith('0x') || wallet.address.length !== 42) {
            throw new Error('Invalid Ethereum address format');
        }

        // 验证私钥格式
        if (!wallet.privateKey.startsWith('0x') || wallet.privateKey.length !== 66) {
            throw new Error('Invalid private key format');
        }

        // 验证公钥格式
        if (!wallet.publicKey.startsWith('0x') || wallet.publicKey.length !== 130) {
            throw new Error('Invalid public key format');
        }

        return {
            address: wallet.address,
            private_key: wallet.privateKey,
            public_key: wallet.publicKey,
            chain_type: chainType
        };
    } catch (error) {
        console.error('Error generating wallet:', error);
        throw error;
    }
}

export async function signMessage(address: string, message: string, privateKey: string): Promise<string> {
    try {
        // 验证参数
        if (!address || !message || !privateKey) {
            throw new Error('Missing required parameters for signing');
        }

        // 验证地址格式
        if (!address.startsWith('0x') || address.length !== 42) {
            throw new Error('Invalid Ethereum address format');
        }

        // 验证私钥格式
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
            throw new Error('Invalid private key format');
        }

        // TODO: Implement WASM signing
        return '0x...'; // Placeholder
    } catch (error) {
        console.error('Error signing message:', error);
        throw error;
    }
}

export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
        // 验证参数
        if (!address || !message || !signature) {
            throw new Error('Missing required parameters for verification');
        }

        // 验证地址格式
        if (!address.startsWith('0x') || address.length !== 42) {
            throw new Error('Invalid Ethereum address format');
        }

        // 验证签名格式
        if (!signature.startsWith('0x') || signature.length !== 132) {
            throw new Error('Invalid signature format');
        }

        // TODO: Implement WASM verification
        return true; // Placeholder
    } catch (error) {
        console.error('Error verifying signature:', error);
        throw error;
    }
} 