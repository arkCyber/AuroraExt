import { UserInfo } from '../types/user';

const STORAGE_KEY = 'aurora_user_info';

function validateUserInfo(userInfo: UserInfo): void {
    if (!userInfo.id || typeof userInfo.id !== 'string') {
        throw new Error('Invalid user ID');
    }

    if (!userInfo.nickname || typeof userInfo.nickname !== 'string') {
        throw new Error('Invalid nickname');
    }

    if (!userInfo.avatar || typeof userInfo.avatar !== 'string') {
        throw new Error('Invalid avatar URL');
    }

    if (!userInfo.deviceId || typeof userInfo.deviceId !== 'string') {
        throw new Error('Invalid device ID');
    }

    if (!userInfo.mnemonic || typeof userInfo.mnemonic !== 'string') {
        throw new Error('Invalid mnemonic');
    }

    if (!userInfo.walletInfo || typeof userInfo.walletInfo !== 'object') {
        throw new Error('Invalid wallet info');
    }

    if (!userInfo.walletInfo.address || typeof userInfo.walletInfo.address !== 'string') {
        throw new Error('Invalid wallet address');
    }

    if (!userInfo.walletInfo.chainType || typeof userInfo.walletInfo.chainType !== 'string') {
        throw new Error('Invalid chain type');
    }

    if (!userInfo.createdAt || typeof userInfo.createdAt !== 'number') {
        throw new Error('Invalid creation timestamp');
    }

    if (!userInfo.updatedAt || typeof userInfo.updatedAt !== 'number') {
        throw new Error('Invalid update timestamp');
    }
}

export class UserService {
    static async getUserInfo(): Promise<UserInfo | null> {
        try {
            const userInfoStr = localStorage.getItem(STORAGE_KEY);
            if (!userInfoStr) {
                return null;
            }

            const userInfo = JSON.parse(userInfoStr);
            validateUserInfo(userInfo);
            return userInfo;
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    static async saveUserInfo(userInfo: UserInfo): Promise<void> {
        try {
            validateUserInfo(userInfo);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
        } catch (error) {
            console.error('Error saving user info:', error);
            throw error;
        }
    }

    static async updateUserInfo(updates: Partial<UserInfo>): Promise<UserInfo> {
        try {
            const currentInfo = await this.getUserInfo();
            if (!currentInfo) {
                throw new Error('User info not found');
            }

            const updatedInfo: UserInfo = {
                ...currentInfo,
                ...updates,
                updatedAt: Date.now()
            };

            validateUserInfo(updatedInfo);
            await this.saveUserInfo(updatedInfo);
            return updatedInfo;
        } catch (error) {
            console.error('Error updating user info:', error);
            throw error;
        }
    }
} 