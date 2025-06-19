import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import { generateMnemonicFromDeviceId, validateMnemonic } from '@/Wasm-Blockchain/wasm-crypto/src/utils/mnemonic';

// 重新导出 validateMnemonic 函数
export { validateMnemonic };

// 定义 Wasm 模块的类型
interface WasmModule {
    generate_wallet: (mnemonic: string, chainType: string) => Promise<{
        address: string;
        chain_type: string;
    }>;
}

// 初始化 Wasm 模块
let wasmInitialized = false;
let wasmModule: WasmModule | null = null;

export async function initBlockchainWasm(): Promise<void> {
    if (wasmInitialized) {
        return;
    }

    try {
        // 使用 chrome.runtime.getURL 获取 Wasm 文件的正确路径
        const wasmUrl = chrome.runtime.getURL('wallet_wasm.js');
        const wasmBgUrl = chrome.runtime.getURL('wallet_wasm_bg.wasm');

        // 动态导入 Wasm 模块
        const module = await import(/* @vite-ignore */ wasmUrl);

        // 初始化 Wasm 模块
        await module.default({
            wasmBinary: await fetch(wasmBgUrl).then(res => res.arrayBuffer())
        });
        wasmModule = module as WasmModule;
        wasmInitialized = true;
        console.log('Wasm module initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Wasm module:', error);
        throw new Error('Failed to initialize Wasm module');
    }
}

export interface WalletInfo {
    address: string;
    chainType: string;
    publicKey: string;
    privateKey: string;
}

export interface SignatureInfo {
    signature: string;
    publicKey: string;
}

export interface BlockchainWallet {
    walletInfo: WalletInfo;
    sign: (message: string) => Promise<SignatureInfo>;
}

export async function generateWalletFromMnemonic(
    mnemonic: string,
    chainType: string = 'ethereum'
): Promise<BlockchainWallet> {
    if (!wasmInitialized || !wasmModule) {
        await initBlockchainWasm();
    }

    // 验证助记词
    if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }

    try {
        // 规范化助记词：移除多余空格，转换为小写，并确保单词之间只有一个空格
        const normalizedMnemonic = mnemonic
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

        // 使用 Wasm 模块生成钱包
        const walletResult = await wasmModule!.generate_wallet(normalizedMnemonic, chainType);
        if (!walletResult) {
            throw new Error('Failed to generate wallet');
        }

        const walletInfo: WalletInfo = {
            address: walletResult.address,
            chainType: walletResult.chain_type,
            publicKey: '',
            privateKey: ''
        };

        // 创建签名函数
        const sign = async (message: string): Promise<SignatureInfo> => {
            try {
                // 等待 crypto 模块就绪
                await cryptoWaitReady();

                // 从助记词生成密钥
                const secretKey = mnemonicToMiniSecret(normalizedMnemonic);

                // 创建 keyring
                const keyring = new Keyring({ type: 'sr25519' });
                const pair = keyring.addFromSeed(secretKey);

                // 签名消息
                const messageBytes = new TextEncoder().encode(message);
                const signature = pair.sign(messageBytes);
                const signatureHex = Buffer.from(signature).toString('hex');
                const publicKeyHex = Buffer.from(pair.publicKey).toString('hex');

                return {
                    signature: signatureHex,
                    publicKey: publicKeyHex
                };
            } catch (error) {
                console.error('Error signing message:', error);
                throw new Error('Failed to sign message');
            }
        };

        return {
            walletInfo,
            sign
        };
    } catch (error) {
        console.error('Error generating wallet:', error);
        throw new Error(`Failed to generate wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function generateWalletFromDeviceId(
    deviceId: string,
    chainType: string = 'ethereum'
): Promise<BlockchainWallet> {
    // 生成助记词
    const mnemonic = await generateMnemonicFromDeviceId(deviceId);

    // 使用助记词生成钱包
    return generateWalletFromMnemonic(mnemonic, chainType);
}

export function getSupportedChainTypes(): string[] {
    return ['ethereum', 'polkadot', 'kusama'];
}
