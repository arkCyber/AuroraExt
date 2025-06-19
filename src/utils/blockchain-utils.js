import { generateMnemonicFromDeviceId } from './bip39-utils.js';

/**
 * 安全地显示地址信息
 * @param {string} address 完整地址
 * @returns {string} 部分隐藏的地址
 */
export function maskAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * 显示完整助记词
 * @param {string} mnemonic 完整助记词
 * @returns {string} 助记词
 */
export function maskMnemonic(mnemonic) {
    if (!mnemonic) return '';
    return mnemonic;
}

/**
 * 获取区块链账户信息
 * @param {string} deviceId 设备ID
 * @returns {Promise<Object>} 账户信息
 */
export async function getBlockchainAccountInfo(deviceId) {
    try {
        const mnemonic = await generateMnemonicFromDeviceId(deviceId);
        return {
            mnemonic: maskMnemonic(mnemonic),
            address: maskAddress(deviceId), // 这里使用设备ID作为示例，实际应该使用真实的区块链地址
            network: 'Aurora', // 网络名称
            balance: '0.00', // 余额
            lastUpdate: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting blockchain account info:', error);
        throw error;
    }
} 