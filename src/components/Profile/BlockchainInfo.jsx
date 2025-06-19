import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space, Spin, Alert, Button, Tooltip } from 'antd';
import { WalletOutlined, KeyOutlined, SafetyCertificateOutlined, CopyOutlined, LockOutlined } from '@ant-design/icons';
import { DatabaseService } from '../../services/database';

const { Title, Text } = Typography;

export default function BlockchainInfo({ deviceId, blockchainInfo }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);

    useEffect(() => {
        loadBlockchainInfo();
    }, [deviceId, blockchainInfo]);

    const loadBlockchainInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            const db = DatabaseService.getInstance();
            await db.initialize();
            const profile = await db.getUserProfile();

            if (profile) {
                setAccountInfo({
                    network: profile.chain_type || 'ETH',
                    address: profile.ethereum_address || '',
                    publicKey: profile.ethereum_public_key || '',
                    mnemonic: profile.mnemonic || '',
                    lastUpdated: profile.updated_at || new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Failed to load blockchain info:', error);
            setError('Failed to load blockchain information');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>
                        <Text>Loading blockchain information...</Text>
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    // 将助记词分割成数组
    const mnemonicWords = accountInfo?.mnemonic?.split(' ') || [];

    return (
        <Card>
            <Title level={4}>
                <WalletOutlined style={{ marginRight: '8px' }} />
                Blockchain Account Information
            </Title>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Network Information */}
                <div>
                    <Text strong>Network:</Text>
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                        {accountInfo?.network || 'ETH'}
                    </Tag>
                </div>

                {/* Address */}
                <div>
                    <Text strong>Address:</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag color="green" style={{ marginLeft: '8px', flex: 1, wordBreak: 'break-all' }}>
                            {accountInfo?.address || 'Generating...'}
                        </Tag>
                        <Tooltip title="Copy Address">
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(accountInfo?.address)}
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Public Key */}
                <div>
                    <Text strong>Public Key:</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag color="purple" style={{ marginLeft: '8px', flex: 1, wordBreak: 'break-all' }}>
                            {accountInfo?.publicKey || 'Generating...'}
                        </Tag>
                        <Tooltip title="Copy Public Key">
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(accountInfo?.publicKey)}
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Private Key (Hidden) */}
                <div>
                    <Text strong>Private Key:</Text>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '4px'
                    }}>
                        <LockOutlined style={{ color: '#999' }} />
                        <Text type="secondary">Private key is securely stored and never displayed</Text>
                    </div>
                </div>

                {/* Mnemonic Phrase */}
                <div>
                    <Text strong>Mnemonic Phrase:</Text>
                    <div style={{
                        marginTop: '8px',
                        padding: '16px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        {mnemonicWords.map((word, index) => (
                            <Tag
                                key={index}
                                color="processing"
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '14px',
                                    margin: '4px'
                                }}
                            >
                                {index + 1}. {word}
                            </Tag>
                        ))}
                        {mnemonicWords.length === 0 && (
                            <Text type="secondary">Generating mnemonic phrase...</Text>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <Text type="secondary">
                            <SafetyCertificateOutlined style={{ marginRight: '4px' }} />
                            Keep this phrase safe and never share it with anyone
                        </Text>
                        <Tooltip title="Copy Mnemonic">
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(accountInfo?.mnemonic)}
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Last Updated */}
                <div>
                    <Text type="secondary">
                        Last updated: {new Date(accountInfo?.lastUpdated || Date.now()).toLocaleString()}
                    </Text>
                </div>
            </Space>
        </Card>
    );
} 