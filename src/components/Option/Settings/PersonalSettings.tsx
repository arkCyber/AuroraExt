/**
 * PersonalSettings Component
 * 
 * This component handles the personal settings page of the application, allowing users to:
 * - Update their profile information (nickname, email, bio)
 * - Manage their avatar
 * - Generate and manage their blockchain wallet
 * - View and copy their device ID and wallet information
 * 修改wasm模块：接收外面的设备id号，字符串形式；区块链类型，字符串；然后内部对设备id号256位 hash计算，作为生成12个助记词的seed，然后由12个助记词生成密钥对于地址，wasm模块返回参数也包括12助记词，
 * 
 * bio 默认值：AI enthusiast from Paris, France. Software engineering major, passionate about blockchain and AI research.
 
    软件启动时，先检查个人数据库中是否存在私钥与公钥，如果有，就在界面显示栏目上的个人所有信息。如果没有，就启动生产过程。设备ID号码与ETH作为字符串参数输入给wasm模块，获取区块链参数信息，在界面信息区块链地址、助记词、公钥等显示并保存到个人数据库中。私钥不显示。
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Alert,
    IconButton,
    Tooltip,
    CircularProgress,
    Avatar,
    Stack,
    Snackbar,
    Select,
    MenuItem,
} from "@mui/material";

import { Copy, Eye, EyeOff, MonitorSmartphone, Camera, RefreshCw, CheckCircle2, XCircle, Mail, FileText, Mouse, Link2, Link2Off, ChevronUp, ChevronDown, FileCog, Save, Globe, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useI18n } from "@/hooks/useI18n";
import { SUPPORTED_LANGUAGES } from "~/utils/supported-languages";
import { WasmService } from '@/services/wasm-service';
import { message, Switch } from 'antd';
import defaultAvatar from '@/assets/default_avatar.png';
import MouseConnect from './MouseConnect';

// Add type declaration for window.aurora
declare global {
    interface Window {
        aurora: {
            wallet: {
                generateWallet: () => Promise<{
                    address: string;
                    publicKey?: string;
                    privateKey?: string;
                    chainType?: string;
                    mnemonic: string;
                }>;
            };
            db: {
                saveWallet: (walletInfo: any) => Promise<void>;
            };
        };
    }
}

interface ProfileInfo {
    nickname: string;
    email: string;
    bio: string;
    avatar?: string;
    mouseConnected?: boolean;
    isAiMouseUser?: boolean;
    company_address?: string;
}

interface WalletInfo {
    address: string;
    publicKey: string;
    privateKey: string;
    chainType: string;
    mnemonic: string;
    id: string;
    deviceId?: string;
    createdAt?: string;
    updatedAt?: string;
    company_address?: string;
    company_publicKey?: string;
    company_privateKey?: string;
    company_mnemonic?: string;
    company_deviceId?: string;
}

// 设备ID验证函数
const isValidDeviceId = (id: string): boolean => {
    console.log('Validating device ID:', id);
    console.log('Device ID type:', typeof id);
    console.log('Device ID length:', id.length);
    console.log('Device ID characters:', id.split(''));

    // 检查是否为空
    if (!id || typeof id !== 'string') {
        console.log('Device ID is empty or not a string');
        return false;
    }

    // 检查是否为10个字符
    if (id.length !== 10) {
        console.log('Device ID length is not 10:', id.length);
        return false;
    }

    // 检查是否只包含字母和数字，并且都是小写
    if (!/^[a-z0-9]{10}$/.test(id)) {
        console.log('Device ID contains invalid characters or uppercase letters');
        return false;
    }

    console.log('Device ID validation passed:', id);
    return true;
};

// 生成设备ID
const generateDeviceId = async (): Promise<string> => {
    try {
        // 获取浏览器信息
        const deviceInfo = {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: (navigator as any).deviceMemory
        };

        console.log('Device Info:', deviceInfo);

        // 将设备信息转换为字符串，移除所有连字符
        const deviceIdString = Object.values(deviceInfo)
            .filter(value => value !== undefined)
            .join('')
            .replace(/[^a-zA-Z0-9]/g, '') // 只保留字母和数字
            .toLowerCase(); // 转换为小写

        console.log('Device ID String:', deviceIdString);

        // 使用 SHA-256 生成哈希
        const encoder = new TextEncoder();
        const data = encoder.encode(deviceIdString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);

        console.log('Hash Array:', hashArray);

        // 将哈希转换为 base36 字符串（只使用小写字母和数字）
        let deviceId = '';
        for (let i = 0; i < 10; i++) {
            // 使用哈希值生成一个 0-35 之间的数字
            const value = hashArray[i] % 36;
            // 将数字转换为 base36 字符（0-9 或 a-z）
            deviceId += value < 10 ? value.toString() : String.fromCharCode(value - 10 + 97);
        }

        console.log('Generated Device ID:', deviceId);

        // 验证生成的设备ID
        if (!isValidDeviceId(deviceId)) {
            console.error('Generated invalid device ID:', deviceId);
            throw new Error('Generated device ID does not match required format');
        }

        return deviceId;
    } catch (error) {
        console.error('Failed to generate device ID:', error);
        throw error;
    }
};

const PersonalSettings: React.FC = () => {
    const { t, i18n } = useTranslation("settings");
    const { locale, changeLocale, isLanguageChanging } = useI18n();
    const [deviceId, setDeviceId] = useState<string>('');
    const [inputDeviceId, setInputDeviceId] = useState<string>('');
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
        nickname: `Aurora${new Date().getTime().toString().slice(-4)}`,
        email: '',
        bio: 'AI enthusiast from Paris, France. Software engineering major, passionate about blockchain and AI research.',
        avatar: '',
        mouseConnected: false,
        isAiMouseUser: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [wasmService, setWasmService] = useState<WasmService | null>(null);
    const [generatingWallet, setGeneratingWallet] = useState(false);
    const [showMnemonic, setShowMnemonic] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);
    const [showMouseDialog, setShowMouseDialog] = useState(false);
    const [mouseInput, setMouseInput] = useState('');
    const [wasmMessage, setWasmMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
    const [wasmInitialized, setWasmInitialized] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [companyAddress, setCompanyAddress] = useState<string>('');

    // Add debug logging for initial mount
    useEffect(() => {
        console.log('=== PersonalSettings Component Mounted ===');
        console.log('Initial language:', i18n.language);
        console.log('Available languages:', i18n.languages);
        console.log('Current locale:', locale);
        console.log('Supported languages:', SUPPORTED_LANGUAGES);
        console.log('Translation function available:', !!t);
    }, []);

    // Add effect to force re-render on language change
    useEffect(() => {
        console.log('=== PersonalSettings Force Update ===');
        console.log('Current language:', i18n.language);
        console.log('Current locale:', locale);

        // Force re-render of translated content
        setProfileInfo(prev => {
            const updated = {
                ...prev,
                nickname: prev.nickname,
                email: prev.email,
                bio: t('personal.defaultBio', prev.bio)
            };
            console.log('Updated profile after force update:', updated);
            return updated;
        });

        // Update error messages
        if (error) {
            const translatedError = error.startsWith('personal.') || error.startsWith('wallet.')
                ? t(error)
                : error;
            setError(translatedError);
        }

        // Update WASM messages
        if (wasmMessage) {
            setWasmMessage(prev => prev ? {
                ...prev,
                message: prev.message.startsWith('wasm.') ? t(prev.message) : prev.message
            } : null);
        }
    }, [i18n.language, t]);

    // 添加语言切换监听器
    useEffect(() => {
        const handleLanguageChanged = () => {
            console.log('=== Language Changed Event ===');
            console.log('New language:', i18n.language);
            console.log('Current locale:', locale);

            // 强制更新组件
            setForceUpdate(prev => prev + 1);

            // 更新所有需要翻译的状态
            setProfileInfo(prev => ({
                ...prev,
                bio: t('personal.defaultBio', prev.bio)
            }));

            if (error) {
                setError(t(error));
            }

            if (wasmMessage) {
                setWasmMessage(prev => ({
                    ...prev!,
                    message: t(prev!.message)
                }));
            }
        };

        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n, t, locale, error, wasmMessage]);

    // 处理语言切换
    const handleLanguageChange = async (newLocale: string) => {
        if (isLanguageChanging) {
            console.log('Language change already in progress, skipping...');
            return;
        }

        console.log('=== Language Change Requested ===');
        console.log('Current locale:', locale);
        console.log('New locale:', newLocale);
        console.log('Current i18n language:', i18n.language);

        try {
            // 首先更新本地状态
            changeLocale(newLocale);

            // 然后更新 i18n
            await i18n.changeLanguage(newLocale);

            // 验证翻译是否已加载
            const verifyTranslation = () => {
                const testKey = 'personal.testLabel';
                const translation = t(testKey);
                const isTranslated = translation !== testKey;
                console.log('Translation verification:', {
                    key: testKey,
                    translation,
                    isDefault: !isTranslated
                });
                return isTranslated;
            };

            // 等待翻译加载
            let attempts = 0;
            while (!verifyTranslation() && attempts < 5) {
                console.log(`Translation not loaded, attempt ${attempts + 1}/5`);
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (attempts >= 5) {
                console.warn('Translation loading timeout, attempting to reload resources...');
                await i18n.reloadResources(newLocale);
            }

            // 保存用户偏好
            await chrome.storage.local.set({
                userLanguage: newLocale,
                lastLanguageUpdate: new Date().toISOString()
            });

            // 强制更新组件
            setForceUpdate(prev => prev + 1);

            message.success(t('personal.languageChanged'));
        } catch (error) {
            console.error('Error changing language:', error);
            message.error(t('personal.languageChangeError'));
            // 尝试恢复到之前的语言
            try {
                await i18n.changeLanguage(locale);
            } catch (revertError) {
                console.error('Failed to revert language:', revertError);
            }
        }
    };

    // 添加语言状态监控
    useEffect(() => {
        console.log('=== Language State Update ===');
        console.log('Current locale:', locale);
        console.log('i18n language:', i18n.language);
        console.log('Is language changing:', isLanguageChanging);
        console.log('Translation test:', t('personal.testLabel'));
        console.log('Available languages:', i18n.languages);

        // 如果检测到状态不一致，尝试同步
        if (locale !== i18n.language && !isLanguageChanging) {
            console.log('Detected language state mismatch, attempting to sync...');
            i18n.changeLanguage(locale).catch(error => {
                console.error('Failed to sync language states:', error);
            });
        }
    }, [locale, i18n.language, isLanguageChanging, t, forceUpdate]);

    // 添加语言切换超时检测
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isLanguageChanging) {
            timeoutId = setTimeout(() => {
                console.error('Language change timeout detected!');
                console.log('Current state:', {
                    locale,
                    i18nLanguage: i18n.language,
                    isLanguageChanging,
                    translationTest: t('personal.testLabel'),
                    availableLanguages: i18n.languages,
                    loadedNamespaces: i18n.getResourceBundle(i18n.language, 'settings')
                });

                // 尝试强制同步状态
                if (locale !== i18n.language) {
                    console.log('Attempting to force sync language states...');
                    i18n.changeLanguage(locale).catch(error => {
                        console.error('Failed to force sync language states:', error);
                    });
                }

                message.error(t('personal.languageChangeTimeout'));
            }, 5000); // 5秒超时
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isLanguageChanging, locale, i18n.language, t]);

    // 添加翻译加载状态监控
    useEffect(() => {
        const checkTranslation = () => {
            const testKey = 'personal.testLabel';
            const translation = t(testKey);
            console.log('Translation check:', {
                key: testKey,
                translation,
                isDefault: translation === testKey,
                currentLanguage: i18n.language
            });
        };

        // 初始检查
        checkTranslation();

        // 监听语言变化
        const handleLanguageChanged = () => {
            console.log('i18n language changed event detected');
            checkTranslation();
        };

        i18n.on('languageChanged', handleLanguageChanged);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n, t]);

    // 初始化 WASM 服务
    useEffect(() => {
        const initWasm = async () => {
            try {
                const service = WasmService.getInstance();
                await service.initialize();
                setWasmService(service);
                setWasmInitialized(true);
            } catch (err) {
                console.error('Failed to initialize WASM service:', err);
                setError(t('wasm.initError'));
            }
        };
        initWasm();
    }, [t]);

    // 加载设备ID和钱包信息
    useEffect(() => {
        const loadData = async () => {
            if (!wasmService) {
                console.log('WASM service not initialized, skipping data load');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // 首先检查 chrome.storage.local 中是否有有效的设备ID
                const storageResult = await chrome.storage.local.get('device_id');
                let validDeviceId = storageResult.device_id;

                // 如果 chrome.storage.local 中没有有效的设备ID，检查 localStorage
                if (!validDeviceId || !isValidDeviceId(validDeviceId)) {
                    console.log('No valid device ID found in chrome.storage.local, checking localStorage...');
                    const storedId = localStorage.getItem('device_id');
                    if (storedId && isValidDeviceId(storedId)) {
                        validDeviceId = storedId;
                        console.log('Found valid device ID in localStorage:', validDeviceId);
                    }
                }

                if (validDeviceId && isValidDeviceId(validDeviceId)) {
                    console.log('Using existing device ID:', validDeviceId);
                    setDeviceId(validDeviceId);
                    setInputDeviceId(validDeviceId);

                    // 从数据库加载所有个人信息
                    const result = await chrome.storage.local.get(validDeviceId);
                    const savedProfile = result[validDeviceId];

                    if (savedProfile) {
                        setProfileInfo(prev => ({
                            ...prev,
                            nickname: savedProfile.nickname || prev.nickname,
                            email: savedProfile.email || prev.email,
                            bio: savedProfile.bio || prev.bio,
                            avatar: savedProfile.avatar || prev.avatar,
                            mouseConnected: savedProfile.mouseConnected || prev.mouseConnected,
                            isAiMouseUser: savedProfile.isAiMouseUser || prev.isAiMouseUser
                        }));
                    }

                    // 加载钱包信息
                    await loadWalletInfo(validDeviceId);
                } else {
                    // 生成新的设备 ID
                    console.log('No valid device ID found, generating new one...');
                    const newId = await generateDeviceId();
                    console.log('Generated new device ID:', newId);

                    // 保存到 localStorage
                    localStorage.setItem('device_id', newId);

                    // 保存到 chrome.storage.local
                    await chrome.storage.local.set({ device_id: newId });
                    console.log('Saved new device ID to both localStorage and chrome.storage.local');

                    setDeviceId(newId);
                    setInputDeviceId(newId);

                    // 保存默认个人信息
                    const defaultProfile = {
                        nickname: `Aurora${new Date().getTime().toString().slice(-4)}`,
                        email: '',
                        bio: 'AI enthusiast from Paris, France. Software engineering major, passionate about blockchain and AI research.',
                        avatar: '',
                        mouseConnected: false,
                        isAiMouseUser: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    await chrome.storage.local.set({ [newId]: defaultProfile });
                    console.log('Saved default profile for new device ID');
                    setProfileInfo(defaultProfile);
                    await loadWalletInfo(newId);
                }
            } catch (err) {
                console.error('Error in device ID initialization:', err);
                setError(t('personal.deviceIdError'));
                message.error(t('personal.deviceIdError'));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [wasmService, t]);

    // 从数据库加载钱包信息
    const loadWalletInfo = async (id: string) => {
        if (!wasmService) {
            console.log('WASM service not initialized, skipping wallet load');
            return;
        }

        try {
            console.log('Loading wallet info for device ID:', id);
            const result = await chrome.storage.local.get(id);
            const savedWallet = result[id];

            // 验证钱包信息的完整性
            const isValidWallet = (wallet: any) => {
                if (!wallet) return false;

                const requiredFields = ['address', 'publicKey', 'mnemonic', 'chainType'];
                const hasAllFields = requiredFields.every(field => wallet[field]);

                if (!hasAllFields) {
                    console.log('Wallet missing required fields:',
                        requiredFields.filter(field => !wallet[field]));
                    return false;
                }

                return true;
            };

            if (savedWallet && isValidWallet(savedWallet)) {
                console.log('Found valid saved wallet:', {
                    address: savedWallet.address,
                    publicKey: savedWallet.publicKey,
                    chainType: savedWallet.chainType,
                    company_address: savedWallet.company_address,
                    company_publicKey: savedWallet.company_publicKey
                });
                setWalletInfo(savedWallet);
                return;
            }

            // 如果钱包信息无效或不存在，生成新的
            console.log(savedWallet ? 'Saved wallet invalid, regenerating...' : 'No saved wallet found, generating new one...');

            if (savedWallet) {
                // 删除无效的钱包信息
                await chrome.storage.local.remove(id);
                console.log('Removed invalid wallet info');
            }

            // 生成新的钱包
            setGeneratingWallet(true);
            try {
                const newWallet = await generateNewWallet(id);
                console.log('Successfully generated new wallet:', {
                    address: newWallet.address,
                    publicKey: newWallet.publicKey,
                    chainType: newWallet.chainType
                });
                setWalletInfo(newWallet);
                message.success(t('wallet.generateSuccess'));
            } catch (error) {
                console.error('Failed to generate new wallet:', error);
                setError(t('wallet.generateError'));
                message.error(t('wallet.generateError'));
                throw error;
            } finally {
                setGeneratingWallet(false);
            }
        } catch (err) {
            console.error('Error in wallet initialization:', err);
            setError(t('wallet.loadError'));
            message.error(t('wallet.loadError'));
        }
    };

    // 重试加载钱包
    const retryLoadWallet = async () => {
        if (!wasmService) {
            setError('Blockchain service not initialized. Please try refreshing the page.');
            return;
        }

        setError(null);
        setLoading(true);
        try {
            await loadWalletInfo(deviceId);
        } catch (err) {
            console.error('Error retrying wallet load:', err);
            setError('Failed to load wallet information');
        } finally {
            setLoading(false);
        }
    };

    // 保存钱包信息到数据库
    const saveWalletInfo = async (info: WalletInfo): Promise<boolean> => {
        try {
            await chrome.storage.local.set({ [info.id!]: info });
            setWalletInfo(info);
            return true;
        } catch (err) {
            console.error('Failed to save wallet:', err);
            setError('Failed to save wallet information');
            return false;
        }
    };

    // 生成新的钱包
    const generateNewWallet = async (deviceId: string) => {
        try {
            if (!wasmService) {
                throw new Error('Blockchain service not initialized');
            }

            // 确保使用完整的设备ID
            console.log('Current device ID for wallet generation:', deviceId);

            // 重新验证设备ID
            if (!deviceId) {
                throw new Error('Device ID is missing');
            }

            const isValid = isValidDeviceId(deviceId);
            if (!isValid) {
                throw new Error(`Invalid device ID format: ${deviceId}`);
            }

            console.log('Generating wallet for device ID:', deviceId);
            const result = await wasmService.generateWallet(deviceId, 'ethereum');
            console.log('WASM wallet generation result:', {
                address: result.address,
                publicKey: result.public_key,
                chainType: result.chain_type
            });

            // 构造完整的钱包信息
            const walletInfo: WalletInfo = {
                address: result.address,
                publicKey: result.public_key || result.address,
                privateKey: '[HIDDEN]',
                chainType: result.chain_type || 'ethereum',
                mnemonic: result.mnemonic,
                id: deviceId,
                deviceId: deviceId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 保存到数据库
            await chrome.storage.local.set({ [deviceId]: walletInfo });
            console.log('Saved new wallet info to database');

            return walletInfo;
        } catch (error) {
            console.error('Wallet generation failed:', error);
            throw error;
        }
    };

    // 复制到剪贴板
    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess({ ...copySuccess, [field]: true });
            setTimeout(() => {
                setCopySuccess({ ...copySuccess, [field]: false });
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
            setError("Failed to copy text to clipboard");
        }
    };

    // 处理头像上传
    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const avatarData = reader.result as string;
                setAvatarPreview(avatarData);
                
                // 更新本地状态
                const updatedProfile = { ...profileInfo, avatar: avatarData };
                setProfileInfo(updatedProfile);
                
                // 立即保存到chrome.storage.local以触发UserProfileDropdown的实时更新
                try {
                    await chrome.storage.local.set({
                        [deviceId]: {
                            ...updatedProfile,
                            updatedAt: new Date().toISOString()
                        }
                    });
                    console.log('Avatar immediately saved to storage for real-time sync');
                    message.success(t('personal.avatarUpdated', { defaultValue: 'Avatar updated successfully' }));
                } catch (error) {
                    console.error('Failed to save avatar immediately:', error);
                    message.error(t('personal.avatarUpdateError', { defaultValue: 'Failed to update avatar' }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // 防抖保存函数
    const debouncedSave = useCallback(async (profileData: ProfileInfo) => {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        const timeout = setTimeout(async () => {
            try {
                setIsSaving(true);
                await chrome.storage.local.set({
                    [deviceId]: {
                        ...profileData,
                        updatedAt: new Date().toISOString()
                    }
                });
                setHasUnsavedChanges(false);
                message.success(t('personal.autoSaveSuccess'));
            } catch (err) {
                console.error('Failed to auto-save profile:', err);
                message.error(t('personal.autoSaveError'));
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1秒延迟

        setAutoSaveTimeout(timeout);
    }, [deviceId, t]);

    // Add debug logging for profile changes
    const handleProfileChange = useCallback((field: keyof ProfileInfo, value: any) => {
        console.log('=== Profile Change ===');
        console.log('Field:', field);
        console.log('New Value:', value);
        console.log('Current Language:', i18n.language);

        setProfileInfo(prev => {
            const updated = { ...prev, [field]: value };
            console.log('Updated Profile:', updated);
            return updated;
        });
    }, [i18n.language]);

    // 清理防抖定时器
    useEffect(() => {
        return () => {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }
        };
    }, [autoSaveTimeout]);

    // 保存个人信息
    const handleSaveProfile = async () => {
        try {
            // 检查数据库中是否已存在钱包信息
            const result = await chrome.storage.local.get(deviceId);
            const existingWallet = result[deviceId];

            if (existingWallet && existingWallet.publicKey) {
                // 如果存在钱包数据，显示确认对话框
                setPendingSave(true);
                setShowConfirmDialog(true);
                return;
            }

            // 如果没有钱包数据，直接保存
            await saveProfileData();
        } catch (err) {
            console.error('Failed to save profile:', err);
            setError('Failed to save profile information');
        }
    };

    const handleConfirmSave = async () => {
        try {
            await saveProfileData();
            setShowConfirmDialog(false);
            setPendingSave(false);
        } catch (err) {
            console.error('Failed to save profile:', err);
            setError('Failed to save profile information');
        }
    };

    const handleCancelSave = () => {
        setShowConfirmDialog(false);
        setPendingSave(false);
    };

    const saveProfileData = async () => {
        try {
            // 保存个人信息到 chrome.storage.local
            await chrome.storage.local.set({
                [deviceId]: {
                    ...profileInfo,
                    updatedAt: new Date().toISOString()
                }
            });
            message.success(t('personal.saveSuccess'));
        } catch (err) {
            console.error('Failed to save profile data:', err);
            setError('Failed to save profile information');
        }
    };

    const handleTestWalletGeneration = async () => {
        try {
            setGeneratingWallet(true);
            await wasmService.testWalletGeneration();
            message.success(t("wallet.testSuccess"));
        } catch (error) {
            console.error("Wallet generation test failed:", error);
            message.error(t("wallet.testError"));
        } finally {
            setGeneratingWallet(false);
        }
    };

    const handleMouseConnect = () => {
        setShowMouseDialog(true);
    };

    const handleMouseDialogConfirm = async (input: string) => {
        try {
            console.log('=== Calling WASM Module from PersonalSettings ===');
            console.log('Input:', input);

            // 调用WASM解密函数
            const result = await wasmService?.decryptAndGenerateMnemonic(input);

            // 详细打印WASM返回结果
            console.log('=== WASM Return Value in PersonalSettings ===');
            console.log('Type:', typeof result);
            console.log('Value:', result);
            console.log('Stringified:', JSON.stringify(result, null, 2));
            console.log('Object keys:', result ? Object.keys(result) : 'null/undefined');

            if (result) {
                // 打印提取的字段值
                console.log('Extracted fields:', {
                    mnemonic: result.mnemonic,
                    address: result.address,
                    publicKey: result.public_key,
                    privateKey: result.private_key,
                    success: result.success
                });

                setWasmMessage({
                    type: 'success',
                    message: `解密成功！\n助记词: ${result.mnemonic}\n地址: ${result.address}\n公钥: ${result.public_key}`
                });

                // 更新钱包信息
                const walletInfo: WalletInfo = {
                    address: result.address,
                    publicKey: result.public_key,
                    privateKey: result.private_key,
                    chainType: 'ethereum',
                    mnemonic: result.mnemonic,
                    id: inputDeviceId,
                    deviceId: inputDeviceId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await saveWalletInfo(walletInfo);
                setWalletInfo(walletInfo);

                // 更新鼠标连接状态
                setProfileInfo(prev => ({
                    ...prev,
                    mouseConnected: true
                }));

                // 保存更新后的个人信息
                await chrome.storage.local.set({
                    [deviceId]: {
                        ...profileInfo,
                        mouseConnected: true,
                        updatedAt: new Date().toISOString()
                    }
                });

                return {
                    success: true,
                    message: 'Wallet generation completed successfully',
                    data: {
                        mnemonic: result.mnemonic,
                        address: result.address,
                        publicKey: result.public_key,
                        privateKey: result.private_key,
                        success: result.success
                    }
                };
            }

            console.log('=======================');
            return {
                success: false,
                message: 'No result returned from WASM module',
                data: undefined
            };
        } catch (error) {
            console.error('Error in WASM module call:', error);
            setWasmMessage({
                type: 'error',
                message: `解密失败: ${error instanceof Error ? error.message : '未知错误'}`
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                data: undefined
            };
        }
    };

    const handleMouseDialogCancel = () => {
        setShowMouseDialog(false);
    };

    // 处理消息关闭
    const handleMessageClose = () => {
        setWasmMessage(null);
    };

    // Add useEffect to load company address
    useEffect(() => {
        const loadCompanyAddress = async () => {
            try {
                const storedData = await chrome.storage.local.get('wallet');
                if (storedData.wallet) {
                    console.log('=== 企业DID信息 ===');
                    console.log('企业DID地址:', storedData.wallet.company_address);
                    setCompanyAddress(storedData.wallet.company_address);
                    if (walletInfo) {
                        walletInfo.company_address = storedData.wallet.company_address;
                    }
                }
            } catch (error) {
                console.error('Failed to get wallet data:', error);
            }
        };
        loadCompanyAddress();
    }, [walletInfo]);

    if (loading && !walletInfo) {
        return (
            <Box sx={{
                p: 3,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}>
                <CircularProgress size={40} />
                <Typography variant="h6" color="text.primary">
                    Initializing blockchain service...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please wait while we set up your wallet
                </Typography>
            </Box>
        );
    }

    if (error && !wasmService) {
        return (
            <Box sx={{
                p: 3,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}>
                <Typography variant="h6" color="error">
                    Blockchain Service Error
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {error}
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                >
                    Refresh Page
                </Button>
            </Box>
        );
    }

    return (
        <div className="p-1 pt-1" key={`personal-settings-${locale}-${forceUpdate}`}>
            {generatingWallet && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg dark:bg-gray-800">
                        <CircularProgress size={40} />
                        <Typography variant="h6" color="text.primary">
                            {t('wallet.generating')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('wallet.generatingSubtitle')}
                        </Typography>
                    </div>
                </div>
            )}

            {/* 添加保存状态指示器 */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
                    {t('personal.personalSettings', { defaultValue: 'Personal Settings' })}
                </h1>
                <div className="flex items-center gap-2">
                    {isSaving && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <CircularProgress size={16} />
                            <span>{t('personal.saving', { defaultValue: 'Saving保存中' })}</span>
                        </div>
                    )}
                    {hasUnsavedChanges && !isSaving && (
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                            <span>{t('personal.unsavedChanges', { defaultValue: 'UnsavedChanges未保存' })}</span>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 mb-6 text-red-700 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-300">
                    <div className="flex items-center justify-between">
                        <span>{t(error.startsWith('personal.') || error.startsWith('wallet.') ? error : 'errors.unknown')}</span>
                        <button
                            onClick={retryLoadWallet}
                            className="flex items-center text-sm hover:text-red-800 dark:hover:text-red-200"
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {t('actions.retry', { defaultValue: 'Retry重试' })}
                        </button>
                    </div>
                </div>
            )}

            {/* 添加DID标签 */}
            <div className="p-2 mb-4 bg-gray-100 rounded dark:bg-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('personal.testLabel', 'Web3 DID身份创建')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('personal.testDescription', '登录前创建Web3 DID身份，将其与AI鼠标关联并使用所有网络功能。鼠标不关联时使用部分功能。')}
                </p>
            </div>

            {/* 个人信息区域 */}
            <div className="mb-6">
                {/* 头像和昵称行 */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                        <Avatar
                            src={avatarPreview || profileInfo.avatar || defaultAvatar}
                            alt={profileInfo.nickname || 'Aurora2025418'}
                            className="bg-white border border-gray-600 w-256 h-256 dark:border-indigo-300 dark:bg-gray-700"
                            sx={{
                                '& .MuiAvatar-img': {
                                    objectFit: 'cover'
                                },
                                borderRadius: '8px'
                            }}
                        >
                            {!avatarPreview && !profileInfo.avatar && (
                                <div className="flex items-center justify-center w-full h-full text-6xl font-bold text-indigo-500 dark:text-indigo-400">
                                    {(profileInfo.nickname || 'Aurora2025418').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Avatar>
                        <input
                            accept="image/*"
                            type="file"
                            id="avatar-upload"
                            hidden
                            onChange={handleAvatarChange}
                        />
                        <label htmlFor="avatar-upload">
                            <Tooltip title={t('personal.uploadAvatar')} arrow>
                                <IconButton
                                    component="span"
                                    className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600"
                                >
                                    <Camera className="w-4 h-4 text-indigo-400" />
                                </IconButton>
                            </Tooltip>
                        </label>
                    </div>
                    <div className="flex items-center flex-1 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                {t('personal.nickname', { defaultValue: 'Nickname昵称' })}:
                            </span>
                            <input
                                type="text"
                                value={profileInfo.nickname}
                                onChange={(e) => {
                                    const newNickname = e.target.value;
                                    handleProfileChange('nickname', newNickname);
                                    setHasUnsavedChanges(true);
                                }}
                                className="px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md w-26 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300 focus:border-indigo-500"
                                placeholder={t('personal.nickname', { defaultValue: 'Nickname昵称' })}
                            />
                        </div>
                        {/* Device ID section with wallet status indicator */}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Device ID label and icon */}
                            <div className="flex items-center gap-1">
                                <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                                    {/* Tooltip explaining device ID regeneration */}
                                    <Tooltip title={!profileInfo.isAiMouseUser ? t('personal.regenerateWallet') : t('personal.deviceId')} arrow>
                                        <span
                                            className={`cursor-${!profileInfo.isAiMouseUser ? 'pointer' : 'help'}`}
                                            onClick={async () => {
                                                if (!profileInfo.isAiMouseUser) {
                                                    // 显示确认对话框
                                                    const confirmed = window.confirm(
                                                        "重新生成DID区块链信息将覆盖现有数据，确定要继续吗？"
                                                    );

                                                    if (confirmed) {
                                                        try {
                                                            setGeneratingWallet(true);
                                                            // 使用 wasmService 重新生成钱包
                                                            const newWallet = await generateNewWallet(deviceId);
                                                            setWalletInfo(newWallet);
                                                            console.log('Successfully regenerated wallet:', {
                                                                address: newWallet.address,
                                                                publicKey: newWallet.publicKey,
                                                                chainType: newWallet.chainType,
                                                                createdAt: newWallet.createdAt
                                                            });
                                                            message.success(t('wallet.regenerateSuccess'));
                                                        } catch (err) {
                                                            console.error('Failed to regenerate wallet:', err);
                                                            message.error(t('wallet.regenerateError'));
                                                        } finally {
                                                            setGeneratingWallet(false);
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            <button
                                                className="flex items-center min-w-0 px-2 py-1.5 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 dark:bg-indigo-400 dark:hover:bg-indigo-500"
                                            >
                                                <MonitorSmartphone className="w-4 h-4 mb-1 mr-2" />
                                                {t('personal.deviceId', { defaultValue: 'DeviceID设备标签' })}
                                            </button>
                                        </span>
                                    </Tooltip>
                                </span>
                                {/* Wallet status indicator - shows check or x icon */}
                                {walletInfo ? (
                                    <CheckCircle2 className="w-4 h-4 text-base text-green-500 dark:text-green-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-base text-red-500 dark:text-red-400" />
                                )}
                            </div>
                            {/* Device ID display */}
                            <span className="px-3 py-1 font-mono text-sm font-medium tracking-wide text-gray-900 bg-white border border-gray-400 rounded-md dark:bg-gray-800 dark:text-gray-300">
                                {deviceId}
                            </span>
                        </div>
                    </div>
                </div>
                {/* 邮箱输入框 */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Mail className="w-4 h-4 dark:text-indigo-400" />
                        {t('personal.email', { defaultValue: 'Email邮箱' })}:
                    </span>
                    <input
                        type="email"
                        value={profileInfo.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="w-[40%] px-3 py-1 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-500 dark:text-indigo-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                        placeholder={t('personal.emailPlaceholder', { defaultValue: 'Enter your email' })}
                    />
                    {/* AI Mouse User Status Toggle */}
                    <Tooltip title="购买AI鼠标后可启用本功能" placement="top" arrow>
                        <span className="flex items-center gap-1 ml-auto text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Mouse className="w-4 h-4 dark:text-indigo-400" />
                            {t('personal.aiMouseUser', { defaultValue: 'MouseBind鼠标绑定' })}
                        </span>
                    </Tooltip>
                    {/* Toggle switch for AI Mouse user status */}
                    <Switch
                        checked={profileInfo.isAiMouseUser || false}
                        onChange={async (checked) => {
                            handleProfileChange('isAiMouseUser', checked);
                        }}
                        size="small"
                        className="!bg-gray-600 [&.ant-switch-checked]:!bg-indigo-500 hover:opacity-90"
                    />
                </div>

                {/* 个人简介输入框 */}
                <div className="flex items-start gap-2">
                    <span className="flex items-center gap-1 pt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="w-4 h-4 dark:text-indigo-400" />
                        {t('personal.bio', { defaultValue: 'Bio个人简介' })}:
                    </span>
                    <textarea
                        value={profileInfo.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        rows={3}
                        className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200 bg-white border border-gray-300 rounded-md resize-none dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                        placeholder={t('personal.bio', { defaultValue: 'Enter your bio' })}
                    />
                </div>
                {/* AI Mouse 连接状态 */}
                <div className="my-4 border-t border-gray-300 dark:border-gray-700"></div>
                {profileInfo.isAiMouseUser && (
                    <div className="flex items-center gap-2 mt-7">
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Mouse className="w-4 h-4 dark:text-indigo-400" />
                            {t('personal.aiMouse', { defaultValue: 'AI-Mouse' })}:
                        </span>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleMouseConnect}
                            className="px-4 py-1 text-sm text-white normal-case transition-colors duration-200 bg-indigo-500 rounded-md hover:bg-indigo-600 dark:bg-indigo-400 dark:hover:bg-indigo-500"
                        >
                            {t('personal.connect', { defaultValue: 'Connect连接' })}
                        </Button>
                        {/* Mouse Connection Status Section */}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Status Label */}
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('personal.mouseConnected', { defaultValue: 'MouseStatus鼠标连接状态' })}:
                            </span>
                            {/* Status Indicator and Text */}
                            <div className="flex items-center gap-1">
                                {/* Connection Icon - Shows green check when company address exists, red X when it doesn't */}
                                {companyAddress ? (
                                    <Link2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                                ) : (
                                    <Link2Off className="w-4 h-4 text-red-500 dark:text-red-400" />
                                )}
                                {/* Status Text - Shows "Connected" when company address exists, "NotConnected" when it doesn't */}
                                <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300">
                                    {companyAddress ?
                                        t('personal.mouseConnected', { defaultValue: 'Connected' }) :
                                        t('personal.mouseNotConnected', { defaultValue: 'NotConnected' })
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 公司DID地址信息显示 */}
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Wallet className="w-4 h-4 dark:text-indigo-400" />
                            {t('personal.companyAddress', { defaultValue: 'MouseBind Address地址' })}:
                        </span>
                        <div className="flex items-center gap-1">
                            {/* 从存储中读取并显示地址和公钥 */}
                            {profileInfo.isAiMouseUser ? (
                                companyAddress ? (
                                    <>
                                        <Tooltip title={companyAddress} arrow>
                                            <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300">
                                                {`${companyAddress.slice(0, 6)}...${companyAddress.slice(-4)}`}
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={copySuccess.companyAddress ? "Copied!" : "Copy address"} arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopy(companyAddress, 'companyAddress')}
                                                className="text-gray-500 hover:text-gray-700 dark:text-indigo-400 dark:hover:text-gray-100"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <span className="px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-400">
                                        {t('personal.notConnected', { defaultValue: 'Not Connected未连接' })}
                                    </span>
                                )
                            ) : (
                                <span className="px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-400">
                                    {t('personal.needMouse', { defaultValue: 'Need AI Mouse需要AI鼠标' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 详细信息展开按钮 */}
                <div className="flex justify-end mb-4">
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-4 py-1 text-sm text-white normal-case transition-colors duration-200 bg-indigo-500 rounded-md hover:bg-indigo-600 dark:bg-indigo-400 dark:hover:bg-indigo-500"
                    >
                        {showDetails ? t('personal.hideDetails', { defaultValue: 'Hide Details隐藏详情' }) : t('personal.showDetails', { defaultValue: 'Show Details显示详情' })}
                        {showDetails ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </Button>
                </div>

                {/* 详细区块链信息 */}
                {showDetails && walletInfo && (
                    <div className="mb-6">
                        <h2 className="pb-2 mb-4 text-lg font-semibold text-gray-900 border-b border-gray-400 dark:text-gray-300 dark:bg-gray-800">
                            {t('personal.blockchainInfo', { defaultValue: 'Web3 DID-Blockchain Information' })}
                        </h2>

                        {/* 地址和公钥信息 */}
                        <div className="mb-4">
                            <div className="flex items-center gap-6">
                                {/* 地址信息 */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('personal.address', { defaultValue: 'DID-Address身份地址' })}
                                        </span>
                                        <Tooltip title={copySuccess.address ? "Copied!" : "Copy address"} arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopy(walletInfo.address, 'address')}
                                                className="text-gray-500 hover:text-gray-700 dark:text-indigo-400 dark:hover:text-gray-100"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                    <div className="p-1 font-mono text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300">
                                        <Tooltip
                                            title={walletInfo.address.startsWith('0x') ? walletInfo.address : `0x${walletInfo.address}`}
                                            arrow
                                        >
                                            <span>
                                                {walletInfo.address.startsWith('0x')
                                                    ? `${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`
                                                    : `0x${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-4)}`}
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>

                                {/* 公钥信息 */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('personal.publicKey', { defaultValue: 'PublicKey公钥' })}
                                        </span>
                                        <Tooltip title={copySuccess.publicKey ? "Copied!" : "Copy public key"} arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopy(walletInfo.publicKey, 'publicKey')}
                                                className="text-gray-500 hover:text-gray-700 dark:text-indigo-400 dark:hover:text-gray-100"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                    <div className="p-1 font-mono text-sm text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300">
                                        <Tooltip
                                            title={walletInfo.publicKey.startsWith('0x') ? walletInfo.publicKey : `0x${walletInfo.publicKey}`}
                                            arrow
                                        >
                                            <span>
                                                {walletInfo.publicKey.startsWith('0x')
                                                    ? `${walletInfo.publicKey.slice(0, 6)}...${walletInfo.publicKey.slice(-4)}`
                                                    : `0x${walletInfo.publicKey.slice(0, 4)}...${walletInfo.publicKey.slice(-4)}`}
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 助记词信息 */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('personal.mnemonic', { defaultValue: 'Mnemonic助记词' })}
                                </span>
                                <Tooltip title={copySuccess.mnemonic ? "Copied!" : "Copy mnemonic"} arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(walletInfo.mnemonic, 'mnemonic')}
                                        className="text-gray-500 hover:text-gray-700 dark:text-indigo-400 dark:hover:text-gray-100"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </IconButton>
                                </Tooltip>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowMnemonic(!showMnemonic)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-indigo-400 dark:hover:text-gray-100"
                                >
                                    {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </IconButton>
                            </div>
                            {/* Grid layout for displaying mnemonic words */}
                            <div className="grid grid-cols-4 gap-2">
                                {walletInfo.mnemonic.split(' ').map((word, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-1 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 leading-[1.5]"
                                    >
                                        <span className="min-w-[24px] text-center text-sm text-gray-600 dark:text-gray-300 leading-[1.5]">
                                            {index + 1}.
                                        </span>
                                        <span className="text-base text-gray-900 dark:text-gray-300 leading-[1.5]">
                                            {showMnemonic ? word : '••••••••••••'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 确认对话框 */}
                {showConfirmDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ">
                        <div className="w-full max-w-md p-6 bg-white border border-gray-600 rounded-lg shadow-xl dark:border-indigo-300 dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('personal.confirmSaveTitle', { defaultValue: 'Confirm Save Title确认保存标题' })}
                            </h3>
                            <p className="mb-6 text-gray-600 dark:text-gray-300">
                                {t('personal.confirmSaveMessage', { defaultValue: 'Confirm Save Message确认保存消息' })}
                            </p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleCancelSave}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    {t('personal.cancel', { defaultValue: 'Cancel取消' })}
                                </button>
                                <button
                                    onClick={handleConfirmSave}
                                    className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    {t('personal.confirm', { defaultValue: 'Confirm确认' })}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 鼠标连接对话框 */}
                {showMouseDialog && (
                    <MouseConnect
                        deviceId={deviceId}
                        onConfirm={handleMouseDialogConfirm}
                        onCancel={handleMouseDialogCancel}
                    />
                )}

                {/* WASM消息提示框 */}
                <Snackbar
                    open={!!wasmMessage}
                    autoHideDuration={6000}
                    onClose={handleMessageClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleMessageClose}
                        severity={wasmMessage?.type || 'info'}
                        sx={{
                            width: '100%',
                            whiteSpace: 'pre-line',
                            '& .MuiAlert-message': {
                                fontFamily: 'monospace'
                            }
                        }}
                    >
                        {wasmMessage?.message}
                    </Alert>
                </Snackbar>
                {/* 底部按钮区域 */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                    <button
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-400 dark:hover:bg-indigo-500"
                    >
                        <Save className="w-4 h-4" />
                        {t('personal.saveProfile', { defaultValue: 'Save Profile' })}
                    </button>

                    { /* <button
                    onClick={handleTestWalletGeneration}
                    disabled={generatingWallet}
                    className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generatingWallet ? (
                        <div className="flex items-center">
                            <CircularProgress size={20} className="mr-2" />
                            {t('personal.testing')}
                        </div>
                    ) : (
                        t('personal.testWallet')
                    )}
                </button>
                */}

                </div>
            </div>
        </div>
    );
};

export default PersonalSettings; 