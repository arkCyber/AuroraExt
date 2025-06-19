/**
 * UserProfileDropdown Component
 * 
 * A dropdown menu component for user profile management that provides:
 * - User avatar display (shows user avatar if set, otherwise shows default_avatar.png)
 * - User nickname display
 * - Settings access
 * - Logout functionality
 * - Email display (for registered users)
 * 
 * Data Source: Uses PersonalSettings.tsx standard (deviceId-based storage)
 */

import React, { useEffect, useState } from 'react';
import { Dropdown, Avatar, Modal } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import defaultAvatar from '@/assets/default_avatar.png';
import Login from '~/pages/Login';
import { useI18n } from '@/hooks/useI18n';

// 使用与PersonalSettings.tsx相同的ProfileInfo接口，并添加必要字段
interface ProfileInfo {
    nickname: string;
    email: string;
    bio: string;
    avatar?: string;
    mouseConnected?: boolean;
    isAiMouseUser?: boolean;
    company_address?: string;
    is_registered?: boolean;  // 为兼容性添加此字段
}

/**
 * UserProfileDropdown Component
 * Implements a dropdown menu for user profile management using Ant Design components
 */
export const UserProfileDropdown: React.FC = () => {
    // User profile state management
    const [userProfile, setUserProfile] = useState<ProfileInfo | null>(null);
    // Navigation hook for routing
    const navigate = useNavigate();
    // Translation hook
    const { t, i18n } = useTranslation("common");
    // Modal state
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const { locale, changeLocale } = useI18n();
    const [currentLang, setCurrentLang] = useState(locale);

    /**
     * Load user profile on component mount
     */
    useEffect(() => {
        loadUserProfile();
        
        // 添加storage监听器，实时同步PersonalSettings的变化
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local') {
                // 检查是否有device_id相关的变化
                Object.keys(changes).forEach(async (key) => {
                    // 如果变化的key是device_id，重新加载配置
                    if (key === 'device_id') {
                        console.log('Device ID changed, reloading profile...');
                        await loadUserProfile();
                        return;
                    }
                    
                    // 如果变化的key看起来像deviceId（10位字符），检查是否是当前用户的数据
                    if (key.length === 10 && /^[a-z0-9]{10}$/.test(key)) {
                        try {
                            const deviceResult = await chrome.storage.local.get('device_id');
                            if (deviceResult.device_id === key) {
                                console.log('Personal profile data changed, updating avatar...');
                                const newProfileData = changes[key].newValue;
                                if (newProfileData) {
                                    setUserProfile(newProfileData);
                                }
                            }
                        } catch (error) {
                            console.warn('Error checking storage change:', error);
                        }
                    }
                });
            }
        };

        // 注册监听器
        chrome.storage.onChanged.addListener(handleStorageChange);
        
        // 清理函数
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    useEffect(() => {
        setCurrentLang(locale);
    }, [locale]);

    /**
     * Load user profile from database
     * Creates default profile if none exists
     * Ensures user nickname starts with 'Aurora_' prefix
     */
    const loadUserProfile = async () => {
        try {
            console.log('=== Loading User Profile for UserProfileDropdown ===');
            
            // 同时检查PersonalSettings的数据存储
            let personalSettingsProfile = null;
            try {
                // 尝试获取device_id
                const deviceResult = await chrome.storage.local.get('device_id');
                console.log('Device ID from storage:', deviceResult.device_id);
                
                if (deviceResult.device_id) {
                    const personalResult = await chrome.storage.local.get(deviceResult.device_id);
                    personalSettingsProfile = personalResult[deviceResult.device_id];
                    console.log('Found PersonalSettings profile:', {
                        nickname: personalSettingsProfile?.nickname,
                        email: personalSettingsProfile?.email,
                        avatar: personalSettingsProfile?.avatar ? 'Has avatar' : 'No avatar',
                        bio: personalSettingsProfile?.bio ? 'Has bio' : 'No bio'
                    });
                }
            } catch (error) {
                console.warn('Failed to load PersonalSettings profile:', error);
            }
            
            if (personalSettingsProfile) {
                console.log('Setting user profile from PersonalSettings data');
                setUserProfile(personalSettingsProfile);
            } else {
                console.log('No PersonalSettings data found, creating default profile');
                // Create default profile if none exists
                const defaultProfile: ProfileInfo = {
                    nickname: `Aurora_${Date.now()}`,
                    email: '',
                    bio: 'AI enthusiast from Paris, France. Software engineering major, passionate about blockchain and AI research.',
                    avatar: '',
                    mouseConnected: false,
                    isAiMouseUser: false,
                    is_registered: true
                };
                setUserProfile(defaultProfile);
                console.log('Default profile created:', {
                    nickname: defaultProfile.nickname,
                    email: defaultProfile.email || 'No email'
                });
            }
            
            console.log('=== User Profile Loading Complete ===');
        } catch (error) {
            console.error('Failed to load user profile:', error);
            // Set default profile on error
            const fallbackProfile: ProfileInfo = {
                nickname: `Aurora_${Date.now()}`,
                email: '',
                bio: 'AI enthusiast from Paris, France. Software engineering major, passionate about blockchain and AI research.',
                avatar: '',
                mouseConnected: false,
                isAiMouseUser: false,
                is_registered: true
            };
            setUserProfile(fallbackProfile);
            console.log('Fallback profile set due to error');
        }
    };

    /**
     * Handle navigation to auth page
     * Ensures correct path handling for both extension and web contexts
     */
    const handleAuthNavigation = () => {
        console.log('=== Auth Navigation ===');
        console.log('Current environment:', {
            isExtension: !!chrome?.extension,
            extensionId: chrome?.runtime?.id,
            currentUrl: window.location.href
        });

        if (chrome?.extension) {
            try {
                // Get extension options URL
                const optionsUrl = chrome.runtime.getURL('options.html');
                console.log('Extension options URL:', optionsUrl);

                // Construct full auth URL
                const authUrl = `${optionsUrl}#/auth`;
                console.log('Attempting navigation to:', authUrl);

                // Verify URL is valid before navigation
                if (optionsUrl && authUrl) {
                    window.location.href = authUrl;
                } else {
                    console.error('Invalid URL constructed:', { optionsUrl, authUrl });
                    // Fallback to web navigation if URL construction fails
                    navigate('/auth');
                }
            } catch (error) {
                console.error('Error during extension navigation:', error);
                // Fallback to web navigation on error
                navigate('/auth');
            }
        } else {
            console.log('Web context detected, navigating to /auth');
            navigate('/auth');
        }
    };

    // 获取头像URL，使用与PersonalSettings.tsx相同的逻辑
    const getAvatarSrc = () => {
        // 与PersonalSettings.tsx保持一致: avatarPreview || profileInfo.avatar || defaultAvatar
        // 这里没有avatarPreview，所以是: userProfile?.avatar || defaultAvatar
        return userProfile?.avatar || defaultAvatar;
    };

    /**
     * Dropdown menu items configuration
     * Includes: profile, auth, and settings options (logout removed)
     */
    const menuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: (
                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-w-[220px] max-w-[280px]">
                    {/* User Avatar */}
                    <div className="mb-3">
                        <Avatar
                            size={64}
                            src={getAvatarSrc()}
                            icon={<UserOutlined />}
                            className="border-2 border-white dark:border-gray-600 shadow-lg"
                            style={{
                                backgroundColor: '#1890ff'
                            }}
                            onError={() => {
                                console.log('Avatar image failed to load, using fallback');
                                return false;
                            }}
                        >
                            {userProfile?.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 'A'}
                        </Avatar>
                    </div>
                    
                    {/* User Nickname - 确保总是显示 */}
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center px-2 max-w-full">
                        <div className="truncate" title={userProfile?.nickname || 'Aurora User'}>
                            {userProfile?.nickname || 'Aurora User'}
                        </div>
                    </div>
                    
                    {/* User Email - 改进显示逻辑 */}
                    <div className="text-xs text-gray-600 dark:text-gray-300 text-center px-2 max-w-full">
                        {userProfile?.email && userProfile.email.trim() !== '' ? (
                            <div className="truncate" title={userProfile.email}>
                                {userProfile.email}
                            </div>
                        ) : (
                            <div className="text-gray-400 dark:text-gray-500 italic">
                                {t('personal.noEmail', { defaultValue: 'No email set' })}
                            </div>
                        )}
                    </div>
                    
                    {/* 添加一个分隔线和状态指示 */}
                    <div className="w-full mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{t('personal.onlineStatus', { defaultValue: 'Online' })}</span>
                        </div>
                    </div>
                </div>
            ),
            onClick: () => navigate('/settings/account'),
            className: 'profile-card-item'
        },
        {
            key: 'login',
            icon: <LogIn className="w-4 h-4" />,
            label: t('login 登录', { defaultValue: '登录' }),
            onClick: () => {
                setIsLoginModalVisible(true);
            }
        },
       
    ];

    /**
     * Render user avatar and dropdown menu
     * Uses Ant Design Dropdown and Avatar components
     * Properly handles avatar fallbacks: user image -> default image -> user icon -> initials
     */
    return (
        <>
            <Dropdown 
                menu={{ 
                    items: menuItems,
                    style: {
                        padding: 0,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        minWidth: '240px'
                    }
                }} 
                placement="bottomRight"
                overlayStyle={{
                    minWidth: '240px'
                }}
            >
                <div className="flex items-center cursor-pointer">
                    <Avatar
                        size={24}
                        src={getAvatarSrc()}
                        icon={<UserOutlined />}
                        className="w-6 h-6 border border-gray-600 dark:border-gray-600 dark:ring-1 ring-gray-400 dark:ring-gray-500"
                        style={{
                            backgroundColor: '#1890ff'
                        }}
                        onError={() => {
                            console.log('Avatar image failed to load, using fallback');
                            return false; // Allow antd's default fallback behavior
                        }}
                    >
                        {userProfile?.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 'A'}
                    </Avatar>
                </div>
            </Dropdown>
            <Modal
                title={t('login') || '登录'}
                open={isLoginModalVisible}
                onCancel={() => setIsLoginModalVisible(false)}
                footer={null}
                width={400}
                destroyOnClose
            >
                <Login onLoginSuccess={() => setIsLoginModalVisible(false)} />
            </Modal>
        </>
    );
}; 