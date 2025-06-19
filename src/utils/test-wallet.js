import { initBlockchainWasm } from './blockchain.js';
import { generateWalletFromDeviceId, generateWalletFromMnemonic, validateMnemonic } from './blockchain.js';
import { generateMnemonicFromDeviceId } from './bip39-utils.js';

async function testWalletGeneration() {
    try {
        // 初始化 Wasm 模块
        console.log('Initializing Wasm module...');
        await initBlockchainWasm();
        console.log('Wasm module initialized successfully');

        // 测试设备 ID 生成助记词
        console.log('\nTesting mnemonic generation from device ID...');
        const deviceId = 'test-device-123';
        const mnemonic = generateMnemonicFromDeviceId(deviceId);
        console.log('Generated mnemonic:', mnemonic);
        console.log('Mnemonic validation:', validateMnemonic(mnemonic));

        // 测试从设备 ID 生成钱包
        console.log('\nTesting wallet generation from device ID...');
        const walletFromDevice = await generateWalletFromDeviceId(deviceId, 'ETH');
        console.log('Wallet from device ID:', {
            address: walletFromDevice.address,
            chainType: walletFromDevice.chainType,
            mnemonic: walletFromDevice.mnemonic
        });

        // 测试从助记词生成钱包
        console.log('\nTesting wallet generation from mnemonic...');
        const walletFromMnemonic = await generateWalletFromMnemonic(mnemonic, 'ETH');
        console.log('Wallet from mnemonic:', {
            address: walletFromMnemonic.address,
            chainType: walletFromMnemonic.chainType
        });

        // 验证两个钱包地址是否相同
        console.log('\nVerifying wallet addresses match:',
            walletFromDevice.address === walletFromMnemonic.address);

        // 测试不同链类型
        console.log('\nTesting different chain types...');
        const chains = ['ETH', 'BTC', 'BSC', 'MATIC'];
        for (const chain of chains) {
            const wallet = await generateWalletFromDeviceId(deviceId, chain);
            console.log(`${chain} wallet address:`, wallet.address);
        }

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// 运行测试
testWalletGeneration(); 