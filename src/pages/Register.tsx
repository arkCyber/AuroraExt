import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DatabaseService } from '../services/database';

const { Title, Text } = Typography;

interface RegisterProps {
    onRegisterSuccess: () => void;
    onCancel: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [publicKey, setPublicKey] = useState<string>('');
    const { t } = useTranslation();
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchPublicKey = async () => {
            try {
                const db = DatabaseService.getInstance();
                await db.initialize();

                // Get device ID from storage
                const storageResult = await chrome.storage.local.get('device_id');
                const deviceId = storageResult.device_id;

                if (!deviceId) {
                    throw new Error('Device ID not found');
                }

                // Get wallet info from storage
                const walletResult = await chrome.storage.local.get(deviceId);
                const walletInfo = walletResult[deviceId];

                if (!walletInfo || !walletInfo.publicKey) {
                    throw new Error('Public key not found');
                }

                setPublicKey(walletInfo.publicKey);
            } catch (error) {
                console.error('Error fetching public key:', error);
                message.error('Failed to fetch public key from database');
            }
        };

        fetchPublicKey();
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const db = DatabaseService.getInstance();
            await db.initialize();

            if (!publicKey) {
                throw new Error('Public key is required');
            }

            // Here you would typically register the user with your backend
            // For now, we'll just simulate a successful registration
            message.success('Registration successful!');
            onRegisterSuccess();
        } catch (error) {
            message.error('Registration failed. Please try again.');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-4 px-2 sm:px-4 lg:px-6">
            <div className="max-w-md w-full space-y-2">
                <div className="text-center">
                    <div className="inline-block p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <MailOutlined className="text-lg text-white" />
                        </div>
                    </div>
                    <Title level={2} className="mt-1 mb-0 text-gray-900 dark:text-white">
                        {t('auth.createAccount')}
                    </Title>
                    <Text className="text-[10px] text-gray-600 dark:text-gray-400">
                        {t('auth.or')}{' '}
                        <a
                            href="#"
                            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors duration-200"
                            onClick={onCancel}
                        >
                            {t('auth.signIn')}
                        </a>
                    </Text>
                </div>

                <Card
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl"
                    bodyStyle={{ padding: '1rem' }}
                >
                    <Form
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Space direction="vertical" size="small" className="w-full">
                            <Form.Item
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: t('auth.pleaseInputEmail'),
                                    },
                                    {
                                        type: 'email',
                                        message: t('auth.invalidEmail'),
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="text-gray-400" />}
                                    placeholder={t('auth.email')}
                                    size="small"
                                />
                            </Form.Item>

                            <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <Text className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">
                                    {t('auth.publicKey')}
                                </Text>
                                <Text className="font-mono text-[10px] text-gray-900 dark:text-gray-300 break-all">
                                    {publicKey || t('auth.loadingPublicKey')}
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full h-8 text-xs transition-all duration-300 hover:scale-105"
                                loading={loading}
                                disabled={!publicKey}
                            >
                                {t('auth.register')}
                            </Button>
                        </Space>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default Register; 