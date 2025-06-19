import { generateInitialProfile } from '../utils/profileGenerator';

export interface UserProfile {
    nickname: string;
    email?: string;
    ethereum_address?: string;
    ethereum_public_key?: string;
    ethereum_private_key?: string;
    bio?: string;
    avatar_url?: string;
    is_registered?: boolean;
    chain_type?: string;
    blockchain_params?: string;
    created_at?: string;
    updated_at?: string;
}

export class DatabaseService {
    private static instance: DatabaseService;
    private readonly STORE_NAME = 'user_profile';

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        // 检查是否已存在用户配置
        const profile = await this.getUserProfile();
        if (!profile) {
            // 如果不存在，创建默认配置
            const defaultProfile = generateInitialProfile();
            await this.updateUserProfile(defaultProfile);
        }
    }

    public async getUserProfile(): Promise<UserProfile | null> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(this.STORE_NAME, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error('Failed to get user profile'));
                } else {
                    resolve(result[this.STORE_NAME] || null);
                }
            });
        });
    }

    public async updateUserProfile(profile: UserProfile): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [this.STORE_NAME]: profile }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error('Failed to update user profile'));
                } else {
                    resolve();
                }
            });
        });
    }

    public async save(): Promise<void> {
        // 这个方法现在是一个空操作，因为 chrome.storage.local 会自动保存
        return Promise.resolve();
    }
} 