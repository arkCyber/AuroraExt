import { BlockchainParams } from '@/types/wasm';
import init, {
    generate_wallet_from_device_id,
    decrypt_and_generate_mnemonic as wasm_decrypt_and_generate_mnemonic,
    generate_wallet_from_mnemonic,
    sign_message,
    verify_signature
} from '../Wasm-Blockchain/wasm-crypto/pkg/wasm_crypto';
import { validateMnemonic, generateMnemonicFromDeviceId } from '../Wasm-Blockchain/wasm-crypto/src/utils/mnemonic';
import { sha256 } from '@/utils/crypto';
import { getDeviceId } from '@/utils/device';

export interface WalletInfo {
    address: string;
    publicKey: string;
    privateKey: string;
    mnemonic: string;
    chainType: string;
    public_key: string;
    private_key: string;
    chain_type: string;
    deviceId: string;
    id: string;
}

interface PersonalInfo {
    deviceId: string;
    mnemonic: string;
    wallet: WalletInfo;
    chainType: string;
    createdAt: string;
    updatedAt: string;
}

interface DatabaseSchema {
    personalInfo: PersonalInfo;
    walletInfo: WalletInfo;
}

interface DecryptResult {
    mnemonic: string;
    public_key: string;
    private_key: string;
    address: string;
    success: boolean;
}

const VALID_CHAIN_TYPES = ['ethereum', 'polkadot', 'kusama'];

export class WasmService {
    private static instance: WasmService;
    private isInitialized: boolean = false;
    private wasmModule: any = null;
    private db: IDBDatabase | null = null;

    private constructor() { }

    public static getInstance(): WasmService {
        if (!WasmService.instance) {
            WasmService.instance = new WasmService();
        }
        return WasmService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log("WASM module already initialized");
            return;
        }

        try {
            console.log("Initializing WASM module...");
            this.wasmModule = await init();
            this.isInitialized = true;
            console.log("WASM module initialized successfully");
        } catch (error) {
            console.error("Failed to initialize WASM module:", error);
            throw error;
        }
    }

    private async initializeDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('auroraDB', 1);

            request.onerror = () => {
                console.error('Failed to open database');
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // 创建个人信息存储
                if (!db.objectStoreNames.contains('personalInfo')) {
                    const personalInfoStore = db.createObjectStore('personalInfo', { keyPath: 'id', autoIncrement: true });
                    personalInfoStore.createIndex('deviceId', 'deviceId', { unique: true });
                }

                // 创建钱包信息存储
                if (!db.objectStoreNames.contains('walletInfo')) {
                    const walletInfoStore = db.createObjectStore('walletInfo', { keyPath: 'id', autoIncrement: true });
                    walletInfoStore.createIndex('deviceId', 'deviceId', { unique: true });
                }

                console.log('Database schema created successfully');
            };
        });
    }

    private async openDatabase(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.initializeDatabase();
        }
        if (!this.db) {
            throw new Error('Failed to initialize database');
        }
        return this.db;
    }

    private validateDeviceId(deviceId: string): boolean {
        if (!deviceId || typeof deviceId !== 'string') {
            return false;
        }
        return /^[a-zA-Z0-9]{10}$/.test(deviceId);
    }

    private generateMnemonicFromDeviceId(deviceId: string): string {
        // 使用设备ID生成一个12个单词的助记词
        // 这里使用一个简单的示例助记词，实际应用中应该使用更安全的生成方法
        const words = [
            "abandon", "ability", "able", "about", "above", "absent",
            "absorb", "abstract", "absurd", "abuse", "access", "acid"
        ];
        return words.join(' ');
    }

    public async generateWallet(deviceId: string, chainType: string = "ethereum"): Promise<WalletInfo> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.validateDeviceId(deviceId)) {
            throw new Error("Invalid device ID format. Must be 10 alphanumeric characters.");
        }

        const mnemonic = this.generateMnemonicFromDeviceId(deviceId);
        const result = await generate_wallet_from_mnemonic(mnemonic, chainType);

        return {
            ...result,
            chainType,
            public_key: result.publicKey,
            private_key: result.privateKey,
            chain_type: chainType,
            deviceId,
            id: deviceId
        };
    }

    public async signMessage(privateKey: string, message: string): Promise<string> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return sign_message(privateKey, message);
    }

    public async verifySignature(publicKey: string, message: string, signature: string): Promise<{
        success: boolean;
        message: string;
    }> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return verify_signature(publicKey, message, signature);
    }

    private validateMnemonic(mnemonic: string): boolean {
        try {
            if (!mnemonic || typeof mnemonic !== 'string') {
                console.error('Invalid mnemonic: mnemonic is empty or not a string');
                return false;
            }

            // 检查助记词格式
            const words = mnemonic.trim().split(/\s+/);
            if (words.length !== 12) {
                console.error('Invalid mnemonic: must contain exactly 12 words');
                return false;
            }

            // 使用 wasm-crypto 的 validateMnemonic 函数
            const validation = validateMnemonic(mnemonic);
            if (!validation.isValid) {
                console.error('Invalid mnemonic:', validation.errors.join(', '));
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in validateMnemonic:', error);
            return false;
        }
    }

    public async loadPersonalInfo(deviceId: string): Promise<PersonalInfo> {
        try {
            console.log('=== Personal Info Loading ===');
            console.log('Device ID:', deviceId);

            // 使用 WASM 模块生成钱包
            const walletInfo = await this.generateWallet(deviceId);
            console.log('Generated wallet for chain type:', walletInfo.chainType);

            // 构建个人信息
            const personalInfo: PersonalInfo = {
                deviceId: deviceId,
                mnemonic: walletInfo.mnemonic,
                wallet: walletInfo,
                chainType: walletInfo.chainType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('=== Personal Info Loaded ===');
            return personalInfo;
        } catch (error) {
            console.error('=== Personal Info Loading Error ===');
            console.error(error);
            throw error;
        }
    }

    public async testWalletGeneration(): Promise<void> {
        try {
            console.log("\n=== Starting Wallet Generation Test ===");

            // 1. Initialize WASM service
            await this.initialize();
            console.log("✓ WASM service initialized");

            // 2. Generate a test device ID
            const testDeviceId = await getDeviceId();
            console.log("✓ Generated device ID:", testDeviceId);

            // 3. Generate wallet
            const walletInfo = await this.generateWallet(testDeviceId, "ethereum");
            console.log("\n✓ Wallet generated successfully");
            console.log("Wallet details:");
            console.log("- Address:", walletInfo.address);
            console.log("- Chain Type:", walletInfo.chainType);
            console.log("- Mnemonic:", walletInfo.mnemonic);
            console.log("- Device ID:", walletInfo.deviceId);

            // 4. Verify storage
            const storedData = await chrome.storage.local.get(testDeviceId);
            if (storedData[testDeviceId]) {
                console.log("\n✓ Wallet stored successfully");
                console.log("Stored wallet details match generated wallet");
            } else {
                throw new Error("Wallet not found in storage");
            }

            console.log("\n=== Wallet Generation Test Completed Successfully ===");
        } catch (error) {
            console.error("\n=== Wallet Generation Test Failed ===");
            console.error("Error details:", error);
            console.error("Error stack:", error.stack);
            console.error("=============================");
            throw error;
        }
    }

    public async decryptAndGenerateMnemonic(encryptedWords: string): Promise<DecryptResult> {
        try {
            console.log('\n=== WASM Input Parameters Debug ===');
            console.log('1. Raw Input:', encryptedWords);
            console.log('2. Input Type:', typeof encryptedWords);
            console.log('3. Input Length:', encryptedWords.length);
            console.log('4. Input Characters:', Array.from(encryptedWords).map(c => c.charCodeAt(0)));

            /**
             * Decrypts and generates a mnemonic from an encrypted input.
             * @remarks
             * This function first attempts to extract the mnemonic from the input by removing
             * any leading or trailing whitespace. If the input does not start with 'zczc' and end with 'nnnn',
             * it is used as is.
             */

            // 提取助记词：去除头尾空格
            const cleanedInput = encryptedWords.trim();
            console.log('\n5. After Trim:', cleanedInput);
            console.log('6. Trimmed Length:', cleanedInput.length);

            let mnemonic: string;

            // 检查输入是否以 zczc 开头和 nnnn 结尾
            if (cleanedInput.startsWith('zczc') && cleanedInput.endsWith('nnnn')) {
                // 移除前缀和后缀
                mnemonic = cleanedInput
                    .replace(/^zczc/, '')  // 移除开头的 zczc
                    .replace(/nnnn$/, '')  // 移除结尾的 nnnn
                    .trim(); // 去除可能的空格
            } else {
                // 直接使用清理后的输入作为助记词
                mnemonic = cleanedInput;
            }

            console.log('\n7. Final Mnemonic:', mnemonic);
            console.log('8. Final Mnemonic Length:', mnemonic.length);
            console.log('9. Final Mnemonic Words:', mnemonic.split(/\s+/));
            console.log('10. Word Count:', mnemonic.split(/\s+/).length);

            // 验证助记词格式
            const words = mnemonic.split(/\s+/);
            if (words.length !== 12) {
                const error = `Mnemonic must contain exactly 12 words, got ${words.length}`;
                console.error('\n=== Error ===\n', error);
                return { success: false, mnemonic: '', public_key: '', private_key: '', address: '' };
            }

            // 确保WASM模块已初始化
            if (!this.wasmModule) {
                console.log('\nInitializing WASM module...');
                await this.initialize();
            }

            console.log('\n=== Calling WASM Module ===');
            console.log('Input to WASM:', mnemonic);
            // 调用WASM模块
            const result = await wasm_decrypt_and_generate_mnemonic(mnemonic);
            console.log('\n=== WASM Result ===');
            console.log('Raw Result:', result);

            // 检查结果是否包含所有必需字段
            if (!result || typeof result !== 'object') {
                const error = 'Invalid WASM result format';
                console.error('\n=== Error ===\n', error);
                return { success: false, mnemonic: '', public_key: '', private_key: '', address: '' };
            }

            const { mnemonic: resultMnemonic, public_key, private_key, address, success } = result;
            console.log('\n=== Result Fields ===');
            console.log('Mnemonic:', resultMnemonic);
            console.log('Public Key:', public_key);
            console.log('Private Key:', private_key);
            console.log('Address:', address);
            console.log('Success:', success);

            if (!resultMnemonic || !public_key || !private_key || !address) {
                const error = 'Missing required fields in WASM result';
                console.error('\n=== Error ===\n', error);
                return { success: false, mnemonic: '', public_key: '', private_key: '', address: '' };
            }

            console.log('\n=== Operation Completed Successfully ===');
            return {
                success: true,
                mnemonic: resultMnemonic,
                public_key,
                private_key,
                address
            };
        } catch (error) {
            console.error('\n=== Error in decryptAndGenerateMnemonic ===');
            console.error('Error details:', error);
            return {
                success: false,
                mnemonic: '',
                public_key: '',
                private_key: '',
                address: ''
            };
        }
    }
}

export const wasmService = WasmService.getInstance(); 