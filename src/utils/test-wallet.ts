import { describe, it, expect } from 'vitest';
import { initBlockchainWasm } from './blockchain';
import { generateWalletFromDeviceId, generateWalletFromMnemonic, validateMnemonic } from './blockchain';
import { generateMnemonicFromDeviceId } from './bip39-utils';

describe('Wallet Generation Tests', () => {
    it('should generate valid mnemonic from device ID', async () => {
        const deviceId = 'test-device-123';
        const mnemonic = generateMnemonicFromDeviceId(deviceId);
        expect(validateMnemonic(mnemonic)).toBe(true);
        expect(mnemonic.split(' ').length).toBe(12);
    });

    it('should generate consistent wallet from device ID', async () => {
        await initBlockchainWasm();
        const deviceId = 'test-device-123';
        const wallet1 = await generateWalletFromDeviceId(deviceId, 'ETH');
        const wallet2 = await generateWalletFromDeviceId(deviceId, 'ETH');
        expect(wallet1.address).toBe(wallet2.address);
        expect(wallet1.chainType).toBe('ETH');
    });

    it('should generate wallet from mnemonic', async () => {
        await initBlockchainWasm();
        const deviceId = 'test-device-123';
        const mnemonic = generateMnemonicFromDeviceId(deviceId);
        const wallet = await generateWalletFromMnemonic(mnemonic, 'ETH');
        expect(wallet.address).toBeTruthy();
        expect(wallet.chainType).toBe('ETH');
    });

    it('should generate wallets for different chains', async () => {
        await initBlockchainWasm();
        const deviceId = 'test-device-123';
        const chains = ['ETH', 'BTC', 'BSC', 'MATIC'];

        for (const chain of chains) {
            const wallet = await generateWalletFromDeviceId(deviceId, chain);
            expect(wallet.address).toBeTruthy();
            expect(wallet.chainType).toBe(chain);
        }
    });
}); 