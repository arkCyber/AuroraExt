import init, { decrypt_and_generate_mnemonic, generate_wallet_from_device_id } from './wasm-crypto/pkg/wasm_crypto.js';

async function testWasm() {
    try {
        // 初始化 WASM 模块
        console.log('Initializing WASM module...');
        await init();
        console.log('WASM module initialized successfully');

        // 测试 1: 从设备 ID 生成钱包
        console.log('\n=== Test 1: Generate wallet from device ID ===');
        const deviceId = 'test1234567';
        const walletResult = await generate_wallet_from_device_id(deviceId, 'ethereum');
        console.log('Wallet generated successfully:');
        console.log('Address:', walletResult.address);
        console.log('Chain Type:', walletResult.chain_type);
        console.log('Mnemonic:', walletResult.mnemonic);

        // 测试 2: 解密和生成助记词
        console.log('\n=== Test 2: Decrypt and generate mnemonic ===');
        const testMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
        const encryptedInput = `zczc${testMnemonic}nnnn`;
        const decryptionResult = await decrypt_and_generate_mnemonic(encryptedInput);
        console.log('Decryption successful:');
        console.log('Address:', decryptionResult.address);
        console.log('Private Key:', decryptionResult.privateKey);

        console.log('\n=== All tests completed successfully ===');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// 运行测试
testWasm(); 