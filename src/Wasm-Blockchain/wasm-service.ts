export class WasmService {
    private wasmModule: any;

    constructor() {
        this.wasmModule = null;
    }

    public async init(): Promise<void> {
        if (!this.wasmModule) {
            const wasm = await import('../wasm-crypto/pkg/wasm_crypto');
            this.wasmModule = wasm;
        }
    }

    public async decryptAndGenerateMnemonic(encryptedWords: string): Promise<{
        success: boolean;
        data?: {
            mnemonic: string;
            publicKey: string;
            privateKey: string;
            address: string;
            chainType: string;
        };
        error?: string;
    }> {
        try {
            console.log('=== Starting mnemonic decryption ===');
            console.log('Raw input:', encryptedWords);
            console.log('Input length:', encryptedWords.length);
            console.log('Input type:', typeof encryptedWords);

            // 提取助记词：去除头尾空格，然后移除 zczc 和 nnnn
            const cleanedInput = encryptedWords.trim();
            console.log('Cleaned input:', cleanedInput);

            const mnemonic = cleanedInput
                .slice(4, -4) // 移除 zczc 和 nnnn
                .trim(); // 去除可能的空格
            console.log('Processed mnemonic:', mnemonic);
            console.log('Mnemonic length:', mnemonic.length);

            // 验证助记词格式
            const words = mnemonic.split(/\s+/);
            console.log('Split words:', words);
            console.log('Word count:', words.length);

            if (words.length !== 12) {
                const error = `Mnemonic must contain exactly 12 words, got ${words.length}`;
                console.error('Word count error:', error);
                return { success: false, error };
            }

            // 确保WASM模块已初始化
            if (!this.wasmModule) {
                console.log('Initializing WASM module...');
                await this.init();
            }

            console.log('Calling WASM module with mnemonic:', mnemonic);
            // 调用WASM模块
            const result = await this.wasmModule.decrypt_and_generate_mnemonic(mnemonic);
            console.log('WASM result:', result);

            // 检查结果是否包含所有必需字段
            if (!result || typeof result !== 'object') {
                const error = 'Invalid WASM result format';
                console.error('Result format error:', error);
                return { success: false, error };
            }

            const { mnemonic: resultMnemonic, public_key, private_key, address, success, chain_type } = result as any;
            console.log('Result fields:', {
                resultMnemonic,
                public_key,
                private_key,
                address,
                success,
                chain_type
            });

            if (!resultMnemonic || !public_key || !private_key || !address || !chain_type) {
                const error = 'Missing required fields in WASM result';
                console.error('Missing fields error:', error);
                return { success: false, error };
            }

            // 验证字段格式
            if (!public_key.startsWith('0x') || public_key.length !== 132) {
                const error = 'Invalid public key format';
                console.error('Public key format error:', error);
                return { success: false, error };
            }

            if (!private_key.startsWith('0x') || private_key.length !== 66) {
                const error = 'Invalid private key format';
                console.error('Private key format error:', error);
                return { success: false, error };
            }

            if (!address.startsWith('0x') || address.length !== 42) {
                const error = 'Invalid address format';
                console.error('Address format error:', error);
                return { success: false, error };
            }

            console.log('=== Mnemonic decryption completed successfully ===');
            return {
                success: true,
                data: {
                    mnemonic: resultMnemonic,
                    publicKey: public_key,
                    privateKey: private_key,
                    address,
                    chainType: chain_type
                }
            };
        } catch (error) {
            console.error('Error in decryptAndGenerateMnemonic:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
} 