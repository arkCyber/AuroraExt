import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Spin, Card, Typography, Space } from 'antd';
import { UserOutlined, KeyOutlined, ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DatabaseService } from '../services/database';
import { WasmService } from '@/services/wasm-service';
import Register from './Register';

const { Title, Text } = Typography;

interface LoginProps {
    onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [wasmService, setWasmService] = useState<WasmService | null>(null);
    const [email, setEmail] = useState<string>('');
    const [mnemonic, setMnemonic] = useState<string>('');
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        const initWasm = async () => {
            try {
                const service = WasmService.getInstance();
                await service.initialize();
                setWasmService(service);
            } catch (error) {
                console.error('Failed to initialize WASM service:', error);
                message.error('Failed to initialize blockchain service');
            }
        };
        initWasm();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const db = DatabaseService.getInstance();
                await db.initialize();

                // Get device ID from storage
                const storageResult = await chrome.storage.local.get('device_id');
                const deviceId = storageResult.device_id;

                if (!deviceId) {
                    throw new Error('Device ID not found');
                }

                // Get user info from storage
                const userResult = await chrome.storage.local.get(deviceId);
                const userInfo = userResult[deviceId];

                if (!userInfo) {
                    throw new Error('User info not found');
                }

                setEmail(userInfo.email || '');
                setMnemonic(userInfo.mnemonic || '');
            } catch (error) {
                console.error('Error fetching user data:', error);
                message.error('Failed to fetch user data from database');
            }
        };

        fetchUserData();
    }, []);

    const onFinish = async () => {
        if (!wasmService) {
            message.error('Blockchain service not initialized');
            return;
        }

        if (!email || !mnemonic) {
            message.error('Email and mnemonic are required');
            return;
        }

        setLoading(true);
        try {
            // Generate signature using WASM module
            const signature = await wasmService.signMessage(mnemonic, email);

            if (!signature) {
                throw new Error('Failed to generate signature');
            }

            // Verify the signature
            const isValid = await wasmService.verifySignature(signature, email, mnemonic);

            if (isValid) {
                message.success(t('auth.loginSuccess'));

                if (onLoginSuccess) {
                    onLoginSuccess();
                } else {
                    if (chrome?.extension) {
                        const targetUrl = chrome.runtime.getURL('options.html');
                        window.location.href = targetUrl;
                    } else {
                        navigate('/');
                    }
                }
            } else {
                throw new Error('Invalid signature');
            }
        } catch (error) {
            console.error('Login error:', error);
            message.error(t('auth.loginError'));
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterClick = () => {
        setShowRegister(true);
    };

    const handleRegisterSuccess = () => {
        setShowRegister(false);
        message.success(t('auth.registerSuccess'));
    };

    const handleRegisterCancel = () => {
        setShowRegister(false);
    };

    if (showRegister) {
        return <Register onRegisterSuccess={handleRegisterSuccess} onCancel={handleRegisterCancel} />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-2 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 sm:px-4 lg:px-6">
            <div className="w-full max-w-md space-y-2">
                <div className="text-center">
                    <div className="inline-block p-1 bg-white rounded-full shadow-lg dark:bg-gray-800">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
                            <KeyOutlined className="text-lg text-white" />
                        </div>
                    </div>
                    <Title level={2} className="mt-1 mb-0 text-gray-900 dark:text-white">
                        {t('auth.login')}
                    </Title>
                    <Text className="text-[10px] text-gray-600 dark:text-gray-400">
                        {t('auth.noAccount')}{' '}
                        <a
                            href="#"
                            className="font-medium text-indigo-600 transition-colors duration-200 hover:text-indigo-500 dark:text-indigo-400"
                            onClick={handleRegisterClick}
                        >
                            {t('auth.register')}
                        </a>
                    </Text>
                </div>

                <Card
                    className="overflow-hidden transition-all duration-300 bg-white rounded-lg shadow-xl dark:bg-gray-800 hover:shadow-2xl"
                    bodyStyle={{ padding: '1rem' }}
                >
                    <Space direction="vertical" size="small" className="w-full">
                        <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <Text className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">
                                {t('auth.email')}
                            </Text>
                            <div className="flex items-center">
                                <UserOutlined className="mr-1 text-gray-400" />
                                <Text className="font-mono text-gray-900 dark:text-gray-300 text-[10px]">
                                    {email || (
                                        <span className="flex items-center">
                                            <LoadingOutlined className="mr-1" />
                                            {t('auth.loadingEmail')}
                                        </span>
                                    )}
                                </Text>
                            </div>
                        </div>

                        <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <Text className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">
                                {t('auth.mnemonic')}
                            </Text>
                            <div className="flex items-center">
                                <KeyOutlined className="mr-1 text-gray-400" />
                                <Text className="font-mono text-gray-900 dark:text-gray-300 text-[10px] break-all">
                                    {mnemonic || (
                                        <span className="flex items-center">
                                            <LoadingOutlined className="mr-1" />
                                            {t('auth.loadingMnemonic')}
                                        </span>
                                    )}
                                </Text>
                            </div>
                        </div>

                        <Button
                            type="primary"
                            onClick={onFinish}
                            loading={loading}
                            className="w-full h-8 text-xs transition-all duration-300 hover:scale-105"
                            disabled={!wasmService || !email || !mnemonic}
                            icon={<ArrowRightOutlined />}
                        >
                            {t('auth.login')}
                        </Button>
                    </Space>
                </Card>

                <div className="text-center">
                    <Text className="text-[8px] text-gray-500 dark:text-gray-400">
                        {t('auth.secureLogin')}
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default Login; 