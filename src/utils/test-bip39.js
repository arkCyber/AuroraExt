import { generateMnemonicFromDeviceId } from './bip39-utils.js';

async function testMnemonic() {
    try {
        const deviceId = "test123456789";
        const mnemonic = await generateMnemonicFromDeviceId(deviceId);
        console.log('Generated mnemonic:', mnemonic);
    } catch (error) {
        console.error('Error:', error);
    }
}

testMnemonic(); 