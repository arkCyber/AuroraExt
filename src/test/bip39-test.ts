import { generateMnemonicFromDeviceId, validateMnemonic } from '../utils/bip39-utils';

async function testMnemonicGeneration() {
    try {
        // 测试用例1：正常设备ID
        console.log('Test Case 1: Normal device ID');
        const deviceId1 = 'test-device-123';
        const mnemonic1 = await generateMnemonicFromDeviceId(deviceId1);
        console.log('Device ID:', deviceId1);
        console.log('Generated mnemonic:', mnemonic1);
        console.log('Mnemonic validation:', await validateMnemonic(mnemonic1));
        console.log('Word count:', mnemonic1.split(' ').length);
        console.log('-------------------');

        // 测试用例2：短设备ID
        console.log('Test Case 2: Short device ID');
        try {
            const deviceId2 = 'short';
            await generateMnemonicFromDeviceId(deviceId2);
        } catch (error) {
            console.log('Expected error for short device ID:', error.message);
        }
        console.log('-------------------');

        // 测试用例3：包含特殊字符的设备ID
        console.log('Test Case 3: Device ID with special characters');
        try {
            const deviceId3 = 'test@device#123';
            await generateMnemonicFromDeviceId(deviceId3);
        } catch (error) {
            console.log('Expected error for invalid device ID:', error.message);
        }
        console.log('-------------------');

        // 测试用例4：空设备ID
        console.log('Test Case 4: Empty device ID');
        try {
            const deviceId4 = '';
            await generateMnemonicFromDeviceId(deviceId4);
        } catch (error) {
            console.log('Expected error for empty device ID:', error.message);
        }
        console.log('-------------------');

        // 测试用例5：验证生成的助记词
        console.log('Test Case 5: Validate generated mnemonic');
        const deviceId5 = 'test-device-456';
        const mnemonic5 = await generateMnemonicFromDeviceId(deviceId5);
        console.log('Device ID:', deviceId5);
        console.log('Generated mnemonic:', mnemonic5);
        console.log('Mnemonic validation:', await validateMnemonic(mnemonic5));
        console.log('Word count:', mnemonic5.split(' ').length);
        console.log('Words:', mnemonic5.split(' '));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// 运行测试
testMnemonicGeneration(); 